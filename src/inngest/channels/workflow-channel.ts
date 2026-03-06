import { channel, topic } from "@inngest/realtime";
import { ExecutionStatus } from "@/generated/prisma/client";

/**
 * Per-workflow realtime channel using the channel(fn) factory pattern.
 * Usage: workflowChannel(workflowId).execution_update({ executionId, status })
 *
 * Each workflow gets an isolated channel: `workflow-{workflowId}`
 * This is used to sync execution lists and history sidebars instantly.
 */
export const workflowChannel = channel(
    (workflowId: string) => `workflow-${workflowId}`
).addTopic(
    topic("execution_update").type<{
        executionId: string;
        status: ExecutionStatus;
    }>()
);
