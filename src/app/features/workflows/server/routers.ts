import { generateSlug } from "random-word-slugs"
import { createId } from "@paralleldrive/cuid2";

import prisma from "@/lib/db";
import { createTRPCRouter, workflowLimitedProcedure, protectedProcedure } from "@/trpc/init";
import type { Node, Edge } from "@xyflow/react";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/generated/prisma/client";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";
import { isUserPremium } from "@/lib/polar";
import { WORKFLOW_LIMITS } from "@/config/constants";
import { TRPCError } from "@trpc/server";

export const workflowRouters = createTRPCRouter({
    execute: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id,
                    userId: ctx.auth.user.id,
                },
            });

            await sendWorkflowExecution({
                workflowId: input.id,
            });

            return workflow;
        }),

    create: workflowLimitedProcedure
        .input(z.object({
            templateId: z.string().optional(),
            name: z.string().optional(),
            description: z.string().optional(),
            nodes: z.array(z.any()).optional(),
            edges: z.array(z.any()).optional(),
        }).optional())
        .mutation(async ({ ctx, input }) => {
            const templateId = input?.templateId;
            let baseName = input?.name;

            // 1. Determine base name based on creation type
            if (!baseName) {
                if (templateId) {
                    const template = await prisma.workflowTemplate.findUniqueOrThrow({
                        where: { id: templateId }
                    });
                    baseName = `Copy of ${template.name}`;
                } else if (!input?.nodes) {
                    // Blank workflow
                    baseName = generateSlug();
                } else {
                    // Manual/Showcase - if no name is provided, default to a slug
                    baseName = generateSlug();
                }
            }

            let finalName = baseName;

            // 2. Incremental numbering for deduplication per user
            const existingWorkflows = await prisma.workflow.findMany({
                where: {
                    userId: ctx.auth.user.id,
                    name: { startsWith: baseName }
                },
                select: { name: true }
            });

            if (existingWorkflows.some(w => w.name === baseName)) {
                let counter = 1;
                while (existingWorkflows.some(w => w.name === `${baseName} (${counter})`)) {
                    counter++;
                }
                finalName = `${baseName} (${counter})`;
            }

            // 1. Handle template-based creation if only ID is provided
            if (templateId && !input?.nodes) {
                const template = await prisma.workflowTemplate.findUniqueOrThrow({
                    where: { id: templateId }
                });

                const templateNodes = (template.nodes || []) as any[];
                const templateConnections = (template.connections || []) as any[];

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
                        fromNodeId: idMap.get(conn.fromNodeId)!,
                        toNodeId: idMap.get(conn.toNodeId)!,
                        fromOutput: conn.fromOutput || "main",
                        toInput: conn.toInput || "main",
                    };
                });

                return await prisma.$transaction(async (tx) => {
                    const newWorkflow = await tx.workflow.create({
                        data: {
                            name: finalName,
                            userId: ctx.auth.user.id,
                            nodes: { createMany: { data: clonedNodes } },
                            connections: { createMany: { data: clonedConnections } }
                        }
                    });

                    await tx.workflowTemplate.update({
                        where: { id: templateId },
                        data: { useCount: { increment: 1 } }
                    });

                    return newWorkflow;
                });
            }

            // 2. Handle manual injection (e.g. from Showcase after client-side remapping)
            if (input?.nodes) {
                const manualNodes = input.nodes.map((n: any) => ({
                    id: n.id || createId(),
                    name: n.name || n.type || "unknown",
                    type: n.type as NodeType,
                    position: n.position,
                    data: n.data || {},
                }));

                const manualEdges = (input.edges || []).map((e: any) => ({
                    id: createId(),
                    fromNodeId: e.source, // Mapping from ReactFlow 'source'/'target' back to 'fromNodeId'/'toNodeId'
                    toNodeId: e.target,
                    fromOutput: e.sourceHandle || "main",
                    toInput: e.targetHandle || "main",
                }));

                return await prisma.workflow.create({
                    data: {
                        name: finalName,
                        userId: ctx.auth.user.id,
                        nodes: { createMany: { data: manualNodes } },
                        connections: { createMany: { data: manualEdges } }
                    }
                });
            }

            // 3. Standard blank workflow creation
            return prisma.workflow.create({
                data: {
                    name: finalName,
                    userId: ctx.auth.user.id,
                    nodes: {
                        create: {
                            type: NodeType.INITIAL,
                            position: { x: 0, y: 0 },
                            name: NodeType.INITIAL,
                        },
                    },
                },
            });
        }),

    remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
        return prisma.workflow.delete({
            where: {
                id: input.id,
                userId: ctx.auth.user.id
            },
        })
    }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                nodes: z.array(
                    z.object({
                        id: z.string(),
                        type: z.string().nullish(),
                        position: z.object({ x: z.number(), y: z.number() }),
                        data: z.record(z.string(), z.any().optional()),
                    }),
                ),
                edges: z.array(
                    z.object({
                        source: z.string(),
                        target: z.string(),
                        sourceHandle: z.string().nullish(),
                        targetHandle: z.string().nullish(),
                    }),
                ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id, edges, nodes } = input;

            const workflow = await prisma.workflow.findFirstOrThrow({
                where: { id, userId: ctx.auth.user.id },
            });

            return await prisma.$transaction(async (tx) => {
                await tx.node.deleteMany({
                    where: { workflowId: id },
                });

                await tx.node.createMany({
                    data: nodes.map((node) => ({
                        id: node.id,
                        workflowId: id,
                        name: node.type || "unknown",
                        type: node.type as NodeType,
                        position: node.position,
                        data: node.data || {},
                    })),
                });

                await tx.connection.createMany({
                    data: edges.map((edge) => ({
                        workflowId: id,
                        fromNodeId: edge.source,
                        toNodeId: edge.target,
                        fromOutput: edge.sourceHandle || "main",
                        toInput: edge.targetHandle || "main",
                    })),
                });

                await tx.workflow.update({
                    where: { id },
                    data: { updatedAt: new Date() },
                });

                return workflow;
            })
        }),

    updateName: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string().min(1) }))
        .mutation(({ ctx, input }) => {
            return prisma.workflow.update({
                where: { id: input.id, userId: ctx.auth.user.id },
                data: { name: input.name }
            });
        }),

    updateStatus: protectedProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { id, isActive } = input;

            // If activating a workflow, check for limits
            if (isActive) {
                const isPremium = await isUserPremium(ctx.auth.user.id);

                if (!isPremium) {
                    const activeCount = await prisma.workflow.count({
                        where: {
                            userId: ctx.auth.user.id,
                            isActive: true,
                            id: { not: id }, // Don't count the current one if it was already active
                        },
                    });

                    if (activeCount >= WORKFLOW_LIMITS.MAX_ACTIVE_WORKFLOWS_FREE) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: `You've reached the limit of ${WORKFLOW_LIMITS.MAX_ACTIVE_WORKFLOWS_FREE} active workflows on the free tier. Upgrade to Pro for unlimited active workflows.`,
                        });
                    }
                }
            }

            return prisma.workflow.update({
                where: { id: input.id, userId: ctx.auth.user.id },
                data: { isActive: input.isActive }
            });
        }),

    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findFirstOrThrow({
                where: { id: input.id, userId: ctx.auth.user.id },
                include: { nodes: true, connections: true },
            });

            const nodes: Node[] = workflow.nodes.map((node) => ({
                id: node.id,
                type: node.type,
                position: node.position as { x: number, y: number },
                data: (node.data as Record<string, unknown>) || {},
            }));

            const edges: Edge[] = workflow.connections.map((connection) => ({
                id: connection.id,
                source: connection.fromNodeId,
                target: connection.toNodeId,
                sourceHandle: connection.fromOutput,
                targetHandle: connection.toInput,
            }));

            return {
                id: workflow.id,
                name: workflow.name,
                isActive: workflow.isActive,
                nodes,
                edges,
            };
        }),

    getMany: protectedProcedure
        .input(z.object({
            page: z.number().default(PAGINATION.DEFAULT_PAGE),
            pageSize: z.number().min(PAGINATION.MIN_PAGE_SIZE).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
            search: z.string().default(""),
        })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, search } = input;

            const [items, totalCount] = await Promise.all([
                prisma.workflow.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    where: {
                        userId: ctx.auth.user.id,
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        updatedAt: "desc"
                    }
                }),
                prisma.workflow.count({
                    where: {
                        userId: ctx.auth.user.id,
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
                items: items,
                page,
                pageSize,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage
            };
        }),

    getUsage: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.auth.user.id;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [usage, activeCount, totalCount] = await Promise.all([
            prisma.userUsage.findUnique({
                where: {
                    userId_month_year: {
                        userId,
                        month,
                        year,
                    },
                },
            }),
            prisma.workflow.count({
                where: {
                    userId,
                    isActive: true,
                },
            }),
            prisma.workflow.count({
                where: {
                    userId,
                },
            }),
        ]);

        return {
            executionsCount: usage?.executionsCount || 0,
            activeWorkflowsCount: activeCount,
            totalWorkflowsCount: totalCount,
        };
    }),
});