"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchAnthropicRealtimeToken } from "./actions";
import { AVAILABLE_MODELS, AnthropicDialog, AnthropicFormValues } from "./dialog";
import { ANTHROPIC_CHANNEL_NAME } from "@/inngest/channels/anthropic";

type AnthropicNodeData = Partial<AnthropicFormValues>;

type AnthropicNodeType = Node<AnthropicNodeData>;

export const AnthropicNode = memo((props: NodeProps<AnthropicNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: ANTHROPIC_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchAnthropicRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: AnthropicFormValues) => {
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
    const description = nodeData?.userPrompt ? `${nodeData.model || AVAILABLE_MODELS[0]} : ${nodeData.userPrompt.slice(0, 50)}...` : "Not Configured";

    return (
        <>
            <AnthropicDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/anthropic.svg"
                name="Anthropic"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

AnthropicNode.displayName = "AnthropicNode"