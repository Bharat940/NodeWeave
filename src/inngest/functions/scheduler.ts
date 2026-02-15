import { inngest } from "../client";
import prisma from "@/lib/db";
import { NodeType } from "@/generated/prisma/client";
import { CronExpressionParser } from "cron-parser";

export const scheduler = inngest.createFunction(
    { id: "scheduler" },
    { cron: "* * * * *" },
    async ({ step }) => {
        const triggers = await step.run("fetch-cron-triggers", async () => {
            // Note: In a high-scale production environment, fetching ALL cron triggers might be inefficient.
            // We would likely want to shard this or using a distributed locking mechanism.
            return prisma.node.findMany({
                where: {
                    type: NodeType.CRON_TRIGGER,
                },
                select: {
                    id: true,
                    workflowId: true,
                    data: true,
                }
            });
        });

        const now = new Date();
        // Zero out seconds and milliseconds to match the cron minute
        now.setSeconds(0, 0);

        const eventsToFire: any[] = [];

        for (const trigger of triggers) {
            const cron = (trigger.data as { cron?: string }).cron;
            if (!cron) continue;

            try {
                // Check if the schedule should run at the current minute
                // We use currentDate: oneMinuteAgo because cron-parser returns the *next* run time relative to the start date.
                // If we want to know if it runs *now*, we ask "what is the next run after 1 minute ago?"
                const oneMinuteAgo = new Date(now.getTime() - 60000);
                const safeInterval = CronExpressionParser.parse(cron, { currentDate: oneMinuteAgo });
                const nextRun = safeInterval.next().toDate();

                if (nextRun.getTime() === now.getTime()) {
                    eventsToFire.push({
                        name: "workflows/execute.workflow",
                        data: {
                            workflowId: trigger.workflowId,
                            initialData: {
                                triggerTime: now.toISOString(),
                            },
                        },
                    });
                }
            } catch (err) {
                console.error(`Failed to parse cron for node ${trigger.id}:`, err);
            }
        }

        if (eventsToFire.length > 0) {
            await step.run("trigger-workflows", async () => {
                await inngest.send(eventsToFire);
            });
        }

        return { triggered: eventsToFire.length };
    }
);
