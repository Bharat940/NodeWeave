import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";

export const executionsRouters = createTRPCRouter({
    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return prisma.execution.findFirstOrThrow({
                where: { id: input.id, workflow: { userId: ctx.auth.user.id }, },
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    nodeExecutions: {
                        orderBy: {
                            startedAt: "asc",
                        },
                    },
                }
            });
        }),

    getMany: protectedProcedure
        .input(z.object({
            page: z.number().default(PAGINATION.DEFAULT_PAGE),
            pageSize: z
                .number()
                .min(PAGINATION.MIN_PAGE_SIZE)
                .max(PAGINATION.MAX_PAGE_SIZE)
                .default(PAGINATION.DEFAULT_PAGE_SIZE),
            workflowId: z.string().optional(),
        })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, workflowId } = input;

            const where = {
                workflow: { userId: ctx.auth.user.id },
                ...(workflowId ? { workflowId } : {}),
            };

            const [items, totalCount] = await Promise.all([
                prisma.execution.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    where,
                    orderBy: {
                        startedAt: "desc"
                    },
                    include: {
                        workflow: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                }),
                prisma.execution.count({
                    where,
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
});