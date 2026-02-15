"use client";

import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { CronTriggerDialog } from "./dialog";
import { ClockIcon } from "lucide-react";
import { useNodeStatus } from "@/app/features/executions/hooks/use-node-status";
import { GENERIC_CHANNEL_NAME } from "@/inngest/channels/generic";
import { fetchCronTriggerRealtimeToken } from "./actions";

export const CronTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const cron = (props.data.cron as string) || "* * * * *";

    const handleOpenSettings = () => setDialogOpen(true);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GENERIC_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchCronTriggerRealtimeToken,
    });

    return (
        <>
            <CronTriggerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialCron={cron}
                nodeId={props.id}
            />
            <BaseTriggerNode
                {...props}
                icon={ClockIcon}
                name="Schedule"
                description={cron}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

CronTriggerNode.displayName = "CronTriggerNode";
