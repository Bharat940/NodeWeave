import { channel, topic } from "@inngest/realtime";

/**
 * Per-execution realtime channel using the channel(fn) factory pattern.
 * Usage: executionChannel(executionId).status({ nodeId, status })
 *
 * Each execution gets an isolated channel: `execution-{executionId}`
 */
export const executionChannel = channel(
    (executionId: string) => `execution-${executionId}`
).addTopic(
    topic("status").type<{
        nodeId: string;
        status: "loading" | "success" | "error";
    }>()
);
