import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { createId } from "@paralleldrive/cuid2";
import { NodeType } from "@/generated/prisma/browser";

export const templateRouters = createTRPCRouter({
    getFeatured: protectedProcedure.query(async () => {
        return prisma.workflowTemplate.findMany({
            where: { isFeatured: true },
            orderBy: { useCount: 'desc' },
            take: 10
        });
    }),

    getMany: protectedProcedure
        .input(z.object({
            page: z.number().default(PAGINATION.DEFAULT_PAGE),
            pageSize: z.number().min(PAGINATION.MIN_PAGE_SIZE).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
            search: z.string().default(""),
        }))
        .query(async ({ input }) => {
            const { page, pageSize, search } = input;

            const [items, totalCount] = await Promise.all([
                prisma.workflowTemplate.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        useCount: "desc"
                    }
                }),
                prisma.workflowTemplate.count({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        }
                    },
                }),
            ]);

            const totalPages = Math.ceil(totalCount / pageSize);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            return {
                items,
                page,
                pageSize,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage
            };
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return prisma.workflowTemplate.findUniqueOrThrow({
                where: { id: input.id }
            });
        }),

    useTemplate: protectedProcedure
        .input(z.object({ templateId: z.string() }))
        .mutation(async ({ input }) => {
            const template = await prisma.workflowTemplate.findUniqueOrThrow({
                where: { id: input.templateId }
            });

            // Parse nodes and connections
            const templateNodes = (template.nodes || []) as any[];
            const templateConnections = (template.connections || []) as any[];

            // Map old IDs to brand new CUIDs to prevent collisions
            const idMap = new Map<string, string>();
            templateNodes.forEach(node => {
                const originalId = node.originalId || node.id;
                idMap.set(originalId, createId());
            });

            const clonedNodes = templateNodes.map(node => {
                const originalId = node.originalId || node.id;
                return {
                    id: idMap.get(originalId)!,
                    name: node.name || node.type,
                    type: node.type as NodeType,
                    position: node.position,
                    data: node.data || {},
                };
            });

            const clonedConnections = templateConnections.map(conn => {
                return {
                    id: createId(),
                    source: idMap.get(conn.fromNodeId)!,
                    target: idMap.get(conn.toNodeId)!,
                    sourceHandle: conn.fromOutput || "main",
                    targetHandle: conn.toInput || "main",
                };
            });

            // Fire and forget use increment
            await prisma.workflowTemplate.update({
                where: { id: input.templateId },
                data: { useCount: { increment: 1 } }
            });

            return {
                nodes: clonedNodes,
                edges: clonedConnections
            };
        }),

    publishFromWorkflow: protectedProcedure
        .input(z.object({ 
            workflowId: z.string(), 
            name: z.string().min(3), 
            description: z.string(),
            icon: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if user is admin via Better Auth role
            if (ctx.auth.user.role !== "admin") {
                throw new Error("UNAUTHORIZED: Only admins can publish templates.");
            }

            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: { id: input.workflowId, userId: ctx.auth.user.id },
                include: { nodes: true, connections: true }
            });

            // Define keys that should never be exported to public templates
            const SENSITIVE_KEYS = [
                "webhookUrl",
                "accessToken",
                "authToken",
                "accountSid",
                "botToken",
                "chatId",
                "smtpHost",
                "smtpPort",
                "smtpUsername",
                "smtpPassword",
                "apiKey",
                "secret",
                "token",
                "password",
                "phoneNumberId",
                "fromNumber",
                "toNumber",
                "verifyToken",
                "signature",
                "privateKey",
                "clientSecret",
                "signingSecret"
            ];

            const sanitizeNodeData = (data: any): any => {
                if (!data || typeof data !== 'object') return data;

                // Explicitly handle arrays to prevent them from becoming objects
                if (Array.isArray(data)) {
                    return data.map(v => sanitizeNodeData(v));
                }

                const clean = { ...data };
                for (const key of Object.keys(clean)) {
                    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                        clean[key] = ""; // Strip sensitive value
                    } else if (typeof clean[key] === 'object' && clean[key] !== null) {
                        clean[key] = sanitizeNodeData(clean[key]);
                    }
                }
                return clean;
            };

            // Strip database specific IDs and sensitive config from nodes
            const cleanNodes = workflow.nodes.map(n => {
                const { id, workflowId, credentialId, createdAt, updatedAt, data, ...rest } = n as any;
                return {
                    ...rest,
                    data: sanitizeNodeData(data),
                    originalId: id // Keep a reference to remap connections
                };
            });

            const cleanConnections = workflow.connections.map(c => {
                const { id, workflowId, createdAt, updatedAt, ...cleanConnectionData } = c as any;
                return cleanConnectionData;
            });

            return prisma.workflowTemplate.create({
                data: {
                    name: input.name,
                    description: input.description,
                    icon: input.icon,
                    nodes: cleanNodes as any, // Store as JSON
                    connections: cleanConnections as any, // Store as JSON
                    authorId: ctx.auth.user.id,
                    authorName: ctx.auth.user.name,
                    isFeatured: true // Auto feature for admins
                }
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.auth.user.role !== "admin") {
                throw new Error("UNAUTHORIZED: Only admins can delete templates.");
            }
            return prisma.workflowTemplate.delete({
                where: { id: input.id }
            });
        }),

    update: protectedProcedure
        .input(z.object({ 
            id: z.string(), 
            name: z.string().optional(), 
            description: z.string().optional(),
            icon: z.string().optional(),
            isFeatured: z.boolean().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.auth.user.role !== "admin") {
                throw new Error("UNAUTHORIZED: Only admins can update templates.");
            }
            const { id, ...data } = input;
            return prisma.workflowTemplate.update({
                where: { id },
                data
            });
        }),
});
