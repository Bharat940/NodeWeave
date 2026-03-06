import { prefetch, trpc } from "@/trpc/server";
import { PAGINATION } from "@/config/constants";

// Accept the raw nuqs shape (null when not set) rather than the strict tRPC input type
interface PrefetchExecutionsInput {
    page?: number;
    pageSize?: number;
    status?: string | null;
    workflowId?: string | null;
}

export const prefetchExecutions = (params: PrefetchExecutionsInput) => {
    return prefetch(trpc.executions.getMany.queryOptions({
        page: params.page ?? PAGINATION.DEFAULT_PAGE,
        pageSize: params.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE,
        // nuqs returns null for unset params; Zod .optional() only accepts undefined
        status: params.status ?? undefined,
        workflowId: params.workflowId ?? undefined,
    }));
};

export const prefetchExecution = (id: string) => {
    return prefetch(trpc.executions.getOne.queryOptions({ id }));
};