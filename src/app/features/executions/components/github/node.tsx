"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchGitHubRealtimeToken } from "./actions";
import { GitHubDialog, GitHubFormValues } from "./dialog";
import { GITHUB_CHANNEL_NAME } from "@/inngest/channels/github";

type GitHubNodeData = {
    credentialId?: string;
    owner?: string;
    repo?: string;
    issueNumber?: string;
    commentBody?: string;
    variableName?: string;
}

type GitHubNodeType = Node<GitHubNodeData>;

export const GitHubNode = memo((props: NodeProps<GitHubNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GITHUB_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchGitHubRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: GitHubFormValues) => {
        setNodes((nodes) => nodes.map((node) => {
            if (node.id === props.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...values,
                    }
                }
            }
            return node;
        }))
    };

    const nodeData = props.data;
    const description = nodeData?.owner && nodeData?.repo
        ? `${nodeData.owner}/${nodeData.repo}`
        : "Not Configured";

    return (
        <>
            <GitHubDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/github.svg"
                name="GitHub"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

GitHubNode.displayName = "GitHubNode"
