import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useExecutionsParams } from "./use-executions-params";
import { ExecutionStatus } from "@/generated/prisma/browser";

export const useSuspenseExecutions = () => {
    const trpc = useTRPC();
    const [params] = useExecutionsParams();

    return useSuspenseQuery({
        ...trpc.executions.getMany.queryOptions({
            page: params.page,
            pageSize: params.pageSize,
            // nuqs returns null for unset params; tRPC expects undefined
            status: params.status ?? undefined,
            workflowId: params.workflowId ?? undefined,
        }),
        // Poll every 3s while any execution in the list is still QUEUED or RUNNING
        refetchInterval: (query) => {
            const hasActive = query.state.data?.items.some(
                (e) => e.status === ExecutionStatus.QUEUED || e.status === ExecutionStatus.RUNNING
            );
            return hasActive ? 3000 : false;
        },
    });
};

export const useSuspenseExecution = (id: string) => {
    const trpc = useTRPC();

    return useSuspenseQuery({
        ...trpc.executions.getOne.queryOptions({ id }),
        // Poll every 2s while this execution is still QUEUED or RUNNING
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return (status === ExecutionStatus.QUEUED || status === ExecutionStatus.RUNNING) ? 2000 : false;
        },
    });
};
