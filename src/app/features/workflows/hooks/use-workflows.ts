import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkflowParams } from "./use-workflows-params";

export const useSuspenseWorkflows = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams();

    return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
};

// Non-suspense version that won't throw during SSR
export const useWorkflows = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams();

    return useQuery({
        ...trpc.workflows.getMany.queryOptions(params),
        retry: 1, // Only retry once on failure
    });
};

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.create.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" created`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
                queryClient.invalidateQueries(trpc.workflows.getUsage.queryFilter());
            },
            onError: (error) => {
                toast.error(`Failed to create workflow: ${error.message}`);
            },
        }),
    );
}

export const useRemoveWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.workflows.remove.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name} removed"`);
                queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
                queryClient.invalidateQueries(trpc.workflows.getUsage.queryFilter());
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryFilter({ id: data.id }),
                );
            }
        })
    )
};

export const useSuspenseWorkflow = (id: string) => {
    const trpc = useTRPC();

    return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
};

export const useUpdateWorkflowName = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.updateName.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" updated`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({
                        id: data.id,
                    }),
                );
            },
            onError: (error) => {
                toast.error(`Failed to update workflow: ${error.message}`);
            },
        }),
    );
};

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.update.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" saved`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({
                        id: data.id,
                    }),
                );
            },
            onError: (error) => {
                toast.error(`Failed to save workflow: ${error.message}`);
            },
        }),
    );
};

export const useExecuteWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.workflows.execute.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" executed`);
            },
            onError: (error) => {
                toast.error(`Failed to execute workflow: ${error.message}`);
            },
            onSettled: () => {
                // Invalidate executions and usage queries on both success and error
                queryClient.invalidateQueries(trpc.executions.getMany.queryFilter());
                queryClient.invalidateQueries(trpc.workflows.getUsage.queryFilter());
            },
        }),
    );
};

export const useUpdateWorkflowStatus = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.updateStatus.mutationOptions({
            onMutate: async (newStatus) => {
                // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
                await queryClient.cancelQueries(trpc.workflows.getMany.queryFilter());
                await queryClient.cancelQueries(trpc.workflows.getOne.queryFilter({ id: newStatus.id }));

                // Snapshot the previous values
                const previousWorkflows = queryClient.getQueryData(trpc.workflows.getMany.queryFilter().queryKey);
                const previousWorkflow = queryClient.getQueryData(trpc.workflows.getOne.queryFilter({ id: newStatus.id }).queryKey);

                // Optimistically update the single workflow
                queryClient.setQueryData(trpc.workflows.getOne.queryFilter({ id: newStatus.id }).queryKey, (old: any) => {
                    if (!old) return old;
                    return { ...old, isActive: newStatus.isActive };
                });

                // Optimistically update the list
                queryClient.setQueryData(trpc.workflows.getMany.queryFilter().queryKey, (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.map((item: any) =>
                            item.id === newStatus.id ? { ...item, isActive: newStatus.isActive } : item
                        ),
                    };
                });

                return { previousWorkflows, previousWorkflow };
            },
            onError: (error, newStatus, context: any) => {
                // Rollback to the previous state
                if (context?.previousWorkflows) {
                    queryClient.setQueryData(trpc.workflows.getMany.queryFilter().queryKey, context.previousWorkflows);
                }
                if (context?.previousWorkflow) {
                    queryClient.setQueryData(trpc.workflows.getOne.queryFilter({ id: newStatus.id }).queryKey, context.previousWorkflow);
                }
                toast.error(`Failed to update workflow status: ${error.message}`);
            },
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" ${data.isActive ? "activated" : "paused"}`);
            },
            onSettled: (data, error, variables) => {
                // Always refetch after error or success to ensure we are in sync with the server
                queryClient.invalidateQueries(trpc.workflows.getMany.queryFilter());
                queryClient.invalidateQueries(trpc.workflows.getOne.queryFilter({ id: variables.id }));
                queryClient.invalidateQueries(trpc.workflows.getUsage.queryFilter());
            },
        }),
    );
};