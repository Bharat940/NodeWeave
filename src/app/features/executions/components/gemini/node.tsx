"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchGeminiRealtimeToken } from "./actions";
import { AVAILABLE_MODELS, GeminiDialog, GeminiFormValues } from "./dialog";
import { GEMINI_CHANNEL_NAME } from "@/inngest/channels/gemini";

type GeminiNodeData = Partial<GeminiFormValues>;

type GeminiNodeType = Node<GeminiNodeData>;

export const GeminiNode = memo((props: NodeProps<GeminiNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GEMINI_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchGeminiRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: GeminiFormValues) => {
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
            <GeminiDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/gemini.svg"
                name="Gemini"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

GeminiNode.displayName = "GeminiNode"