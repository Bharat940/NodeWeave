"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { executionChannel } from "@/inngest/channels/execution-channel";
import { inngest } from "@/inngest/client";

/**
 * Fully-typed token for the execution channel's status topic.
 * Pass this type to useInngestSubscription for end-to-end type safety.
 */
import { workflowChannel } from "@/inngest/channels/workflow-channel";

export type ExecutionRealtimeToken = Realtime.Token<
    typeof executionChannel,
    ["status"]
>;

export type WorkflowRealtimeToken = Realtime.Token<
    typeof workflowChannel,
    ["execution_update"]
>;

/**
 * Server action: creates a short-lived subscription token scoped to
 * a single execution's channel. Call from the execution detail page
 * to allow the client to subscribe to live node status updates.
 */
export async function fetchExecutionRealtimeToken(
    executionId: string
): Promise<ExecutionRealtimeToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: executionChannel(executionId),
        topics: ["status"],
    });

    return token;
}

/**
 * Server action: creates a short-lived subscription token scoped to
 * a workflow's channel. Call from the executions list or history sidebar
 * to allow the client to subscribe to live execution lifecycle updates.
 */
export async function fetchWorkflowRealtimeToken(
    workflowId: string
): Promise<WorkflowRealtimeToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: workflowChannel(workflowId),
        topics: ["execution_update"],
    });

    return token;
}
