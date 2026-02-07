import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.workflows.getMany>;

export const prefetchWorkflows = async (params: Input) => {
    try {
        await prefetch(trpc.workflows.getMany.queryOptions(params));
    } catch (error) {
        // Silently fail on auth errors (e.g., when returning from checkout)
        // The client-side query will handle fetching the data
        console.error('Failed to prefetch workflows:', error);
    }
};

export const prefetchWorkflow = (id: string) => {
    return prefetch(trpc.workflows.getOne.queryOptions({ id }));
};