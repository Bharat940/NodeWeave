"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchOpenAiRealtimeToken } from "./actions";
import { AVAILABLE_MODELS, OpenAiDialog, OpenAiFormValues } from "./dialog";
import { OPENAI_CHANNEL_NAME } from "@/inngest/channels/openai";

type OpenAiNodeData = Partial<OpenAiFormValues>;

type OpenAiNodeType = Node<OpenAiNodeData>;

export const OpenAiNode = memo((props: NodeProps<OpenAiNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: OPENAI_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchOpenAiRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: OpenAiFormValues) => {
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
            <OpenAiDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/openai.svg"
                name="Openai"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

OpenAiNode.displayName = "OpenAiNode"