"use client";

import { BaseExecutionNode } from "@/app/features/executions/components/base-execution-node";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { useState, memo } from "react";
import { EmailDialog, EmailFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { EMAIL_CHANNEL_NAME } from "@/inngest/channels/email";
import { fetchEmailRealtimeToken } from "./actions";

export const EmailNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: EMAIL_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchEmailRealtimeToken,
    });

    const handleSave = (values: EmailFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === props.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values
                        },
                    };
                }
                return node;
            })
        );
    };

    const nodeData = props.data as Partial<EmailFormValues>;
    const description = nodeData?.to
        ? `To: ${nodeData.to.length > 20 ? nodeData.to.slice(0, 20) + '...' : nodeData.to}`
        : "Not Configured";

    return (
        <>
            <BaseExecutionNode
                {...props}
                icon="/logos/resend.svg"
                name="Email"
                description={description}
                onSettings={() => setDialogOpen(true)}
                onDoubleClick={() => setDialogOpen(true)}
                status={nodeStatus}
            />
            <EmailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSave}
                defaultValues={nodeData}
            />
        </>
    );
});

EmailNode.displayName = "EmailNode";
