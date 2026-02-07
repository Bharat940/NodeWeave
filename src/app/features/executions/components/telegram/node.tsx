"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchTelegramRealtimeToken } from "./actions";
import { TelegramDialog, TelegramFormValues } from "./dialog";
import { TELEGRAM_CHANNEL_NAME } from "@/inngest/channels/telegram";

type TelegramNodeData = {
    botToken?: string;
    chatId?: string;
    content?: string;
    variableName?: string;
}

type TelegramNodeType = Node<TelegramNodeData>;

export const TelegramNode = memo((props: NodeProps<TelegramNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: TELEGRAM_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchTelegramRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: TelegramFormValues) => {
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
    const description = nodeData?.chatId
        ? `To: ${nodeData.chatId}`
        : "Not Configured";

    return (
        <>
            <TelegramDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon="/logos/telegram.svg"
                name="Telegram"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    )
});

TelegramNode.displayName = "TelegramNode"