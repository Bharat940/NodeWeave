"use client";

import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { WebhookTriggerDialog } from "./dialog";
import { useNodeStatus } from "@/app/features/executions/hooks/use-node-status";
import { fetchWebhookRealtimeToken } from "./actions";
import { GENERIC_CHANNEL_NAME } from "@/inngest/channels/generic";
import { WebhookIcon } from "lucide-react";

export const WebhookTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GENERIC_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWebhookRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <WebhookTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            <BaseTriggerNode
                {...props}
                icon={WebhookIcon}
                name="Webhook"
                description="Trigger via HTTP POST"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

WebhookTriggerNode.displayName = "WebhookTriggerNode";
