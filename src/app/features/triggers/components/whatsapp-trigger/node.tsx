import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { WhatsappTriggerDialog } from "./dialog";
import { useNodeStatus } from "@/app/features/executions/hooks/use-node-status";
import { fetchWhatsappTriggerRealtimeToken } from "./actions";
import { WHATSAPP_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/whatsapp-trigger";

export const WhatsappTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: WHATSAPP_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWhatsappTriggerRealtimeToken,
    })

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <WhatsappTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            <BaseTriggerNode
                {...props}
                icon="/logos/whatsapp.svg"
                name="WhatsApp"
                description="Triggers on incoming message"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

WhatsappTriggerNode.displayName = "WhatsappTriggerNode"
