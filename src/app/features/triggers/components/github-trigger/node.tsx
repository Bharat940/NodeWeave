import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { GitHubTriggerDialog } from "./dialog";
import { useNodeStatus } from "@/app/features/executions/hooks/use-node-status";
import { fetchGitHubTriggerRealtimeToken } from "./actions";
import { GITHUB_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/github-trigger";

export const GitHubTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GITHUB_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchGitHubTriggerRealtimeToken,
    })

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <GitHubTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            <BaseTriggerNode
                {...props}
                icon="/logos/github.svg"
                name="GitHub"
                description="Triggers on GitHub events"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

GitHubTriggerNode.displayName = "GitHubTriggerNode"
