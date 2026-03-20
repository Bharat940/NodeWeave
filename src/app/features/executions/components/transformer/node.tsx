"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { ArrowRightLeftIcon } from "lucide-react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { TransformerDialog, TransformerFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchTransformerRealtimeToken } from "./actions";
import { TRANSFORMER_CHANNEL_NAME } from "@/inngest/channels/transformer";

type TransformerNodeData = Partial<TransformerFormValues>;

type TransformerNodeType = Node<TransformerNodeData>;

export const TransformerNode = memo((props: NodeProps<TransformerNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: TRANSFORMER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchTransformerRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: TransformerFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === props.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }
                return node;
            })
        );
    };

    const nodeData = props.data;
    const description = nodeData?.variableName
        ? `${nodeData.rules?.length ?? 0} rule(s) → ${nodeData.variableName}`
        : "Not Configured";

    return (
        <>
            <TransformerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon={ArrowRightLeftIcon}
                name="Data Transformer"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    );
});

TransformerNode.displayName = "TransformerNode";
