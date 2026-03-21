import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkflowParams } from "@/app/features/workflows/hooks/use-workflows-params";

export const useSuspenseTemplates = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams(); // Reusing the same pagination config
    return useSuspenseQuery(trpc.template.getMany.queryOptions(params));
};

export const useTemplates = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams();
    return useQuery({
        ...trpc.template.getMany.queryOptions(params),
        retry: 1,
    });
};

export const useDeleteTemplate = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.template.delete.mutationOptions({
            onSuccess: () => {
                toast.success("Template deleted successfully.");
                queryClient.invalidateQueries(trpc.template.getMany.queryOptions({}));
                queryClient.invalidateQueries(trpc.template.getFeatured.queryOptions());
            },
            onError: (error: any) => {
                toast.error(`Failed to delete template: ${error.message}`);
            }
        })
    );
};
