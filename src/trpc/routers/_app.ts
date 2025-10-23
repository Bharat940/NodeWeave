import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";

export const appRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(({ ctx }) => {
    return prisma.user.findMany({
      where: {
        id: ctx.auth.user.id,
      },
    });
  }),
  getWorkflows: protectedProcedure.query(() => {
    return prisma.workflow.findMany();
  }),
  createWorkFlow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "test/hello.world",
      data: {
        email: "bdangi450@gmail.com"
      }
    })

    return prisma.workflow.create({
      data: {
        name: "test-workflow",
      }
    })
  }),
  testAi: protectedProcedure.mutation(async () => {
    await inngest.send({ name: "execute/ai" });

    return { success: true, message: "Job queued." };
  })
});
// export type definition of API
export type AppRouter = typeof appRouter;
