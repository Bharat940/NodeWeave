"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchWhatsappRealtimeToken } from "./actions";
import { WhatsappDialog, WhatsappFormValues } from "./dialog";
import { WHATSAPP_CHANNEL_NAME } from "@/inngest/channels/whatsapp";

type WhatsappNodeData = {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    toNumber?: string;
    content?: string;
    variableName?: string;
}

type WhatsappNodeType = Node<WhatsappNodeData>;

export const WhatsappNode = memo((props: NodeProps<WhatsappNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: WHATSAPP_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWhatsappRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: WhatsappFormValues) => {
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
    const description = nodeData?.toNumber
        ? `To: ${nodeData.toNumber}`
        : "Not Configured";

    return (
        <>
            <WhatsappDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/whatsapp.svg"
                name="WhatsApp"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

WhatsappNode.displayName = "WhatsappNode"