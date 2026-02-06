import { Button } from "@/components/ui/button";
import { FlaskConicalIcon } from "lucide-react";
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
        <Button size="lg" onClick={handleExecute} disabled={executeWorkflow.isPending}>
            <FlaskConicalIcon className="size-4" />
            Execute Workflow
        </Button>
    )
}