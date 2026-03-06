"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { ExecutionStatus } from "@/generated/prisma/browser";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { ExecutionRealtimeToken } from "../actions";

interface UseExecutionRealtimeOptions {
    executionId: string;
    /** Only subscribe while the execution is still running */
    isRunning: boolean;
    /**
     * Called with node-level status updates so callers can react
     * (e.g., update node status icons without a full refetch).
     */
    onNodeUpdate?: (nodeId: string, status: "loading" | "success" | "error") => void;
    /** Server action that returns a fresh subscription token */
    refreshToken: () => Promise<ExecutionRealtimeToken>;
}

/**
 * Subscribes to live node-status updates for a single execution via
 * Inngest Realtime. When a message arrives it:
 *  1. Calls onNodeUpdate so the UI can update node status icons instantly.
 *  2. Invalidates the TanStack Query cache for the execution so the full
 *     getOne query re-fetches and the node execution list stays accurate.
 */
export function useExecutionRealtime({
    executionId,
    isRunning,
    onNodeUpdate,
    refreshToken,
}: UseExecutionRealtimeOptions) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data, state } = useInngestSubscription({
        enabled: isRunning,
        refreshToken,
    });

    // Invalidate the execution query whenever a realtime status message arrives
    const invalidateExecution = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: trpc.executions.getOne.queryKey({ id: executionId }),
        });
    }, [queryClient, trpc.executions.getOne, executionId]);

    useEffect(() => {
        if (!data.length) return;

        const latest = data[data.length - 1];
        if (latest?.kind !== "data") return;

        const { nodeId, status } = latest.data as {
            nodeId: string;
            status: "loading" | "success" | "error";
        };

        // Notify the UI immediately
        onNodeUpdate?.(nodeId, status);

        // On success or error, the node is done — invalidate to refresh the full list
        if (status === "success" || status === "error") {
            invalidateExecution();
        }

        // When a node goes into loading state and this is the first update,
        // mark the overall execution as running in the cache optimistically
        if (status === "loading") {
            queryClient.setQueryData(
                trpc.executions.getOne.queryKey({ id: executionId }),
                // Spread the old data so the full shape is preserved
                (old) => old ? { ...old, status: ExecutionStatus.RUNNING } : old
            );
        }
    }, [data, onNodeUpdate, invalidateExecution, queryClient, trpc, executionId]);

    return { state };
}
