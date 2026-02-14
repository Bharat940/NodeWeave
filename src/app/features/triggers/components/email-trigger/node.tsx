import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { EmailTriggerDialog } from "./dialog";
import { useNodeStatus } from "@/app/features/executions/hooks/use-node-status";
import { fetchEmailTriggerRealtimeToken } from "./actions";
import { EMAIL_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/email-trigger";

export const EmailTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: EMAIL_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchEmailTriggerRealtimeToken,
    })

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <EmailTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            <BaseTriggerNode
                {...props}
                icon="/logos/resend.svg"
                name="Email"
                description="Triggers on incoming email"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

EmailTriggerNode.displayName = "EmailTriggerNode"
