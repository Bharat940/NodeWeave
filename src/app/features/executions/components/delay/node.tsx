"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { TimerIcon } from "lucide-react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { DelayFormValues, DelayDialog } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchDelayRealtimeToken } from "./actions";
import { DELAY_CHANNEL_NAME } from "@/inngest/channels/delay";

type DelayNodeData = {
    delayValue?: number;
    delayUnit?: "seconds" | "minutes" | "hours" | "days";
};

type DelayNodeType = Node<DelayNodeData>;

export const DelayNode = memo((props: NodeProps<DelayNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: DELAY_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchDelayRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: DelayFormValues) => {
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
    const description = nodeData?.delayValue
        ? `${nodeData.delayValue} ${nodeData.delayUnit ?? "seconds"}`
        : "Not Configured";

    return (
        <>
            <DelayDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon={TimerIcon}
                name="Delay / Wait"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

DelayNode.displayName = "DelayNode"
