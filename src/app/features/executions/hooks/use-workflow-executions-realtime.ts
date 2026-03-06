"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { WorkflowRealtimeToken } from "../actions";

interface UseWorkflowExecutionsRealtimeOptions {
    workflowId: string;
    /** Server action that returns a fresh subscription token */
    refreshToken: () => Promise<WorkflowRealtimeToken>;
    /** Optional callback when an update is received */
    onUpdate?: () => void;
}

/**
 * Subscribes to live execution lifecycle updates for a workflow via Inngest Realtime.
 * When a message arrives (Created, Running, Success, Failed), it:
 *  1. Invalidates the TanStack Query cache for the executions list.
 *  2. Triggers the optional onUpdate callback.
 */
export function useWorkflowExecutionsRealtime({
    workflowId,
    refreshToken,
    onUpdate,
}: UseWorkflowExecutionsRealtimeOptions) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data, state } = useInngestSubscription({
        enabled: !!workflowId,
        refreshToken,
    });

    const invalidateExecutions = useCallback(() => {
        // Invalidate all executions list queries for this workflow
        queryClient.invalidateQueries({
            queryKey: trpc.executions.getMany.queryKey({ workflowId }),
        });
        // Also invalidate generic list queries if no specific workflow filter is applied
        queryClient.invalidateQueries({
            queryKey: trpc.executions.getMany.queryKey({}),
        });
    }, [queryClient, trpc.executions.getMany, workflowId]);

    useEffect(() => {
        if (!data.length) return;

        // Any message on this topic means some execution status changed or a new one was created
        invalidateExecutions();
        onUpdate?.();
    }, [data, invalidateExecutions, onUpdate]);

    return { state };
}
