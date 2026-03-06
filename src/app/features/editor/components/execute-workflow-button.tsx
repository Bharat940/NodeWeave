import { Button } from "@/components/ui/button";
import { FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { useExecuteWorkflow } from "../../workflows/hooks/use-workflows";

export const ExecuteflowButton = ({
    workflowId,
}: {
    workflowId: string
}) => {
    const executeWorkflow = useExecuteWorkflow();

    const handleExecute = () => {
        executeWorkflow.mutate({ id: workflowId });
    }

    return (
        <Button size="sm" onClick={handleExecute} disabled={executeWorkflow.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {executeWorkflow.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : (
                <FlaskConicalIcon className="size-4" />
            )}
            Execute Workflow
        </Button>
    )
}