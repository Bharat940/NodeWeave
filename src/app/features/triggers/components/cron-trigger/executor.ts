import type { NodeExecutor } from "@/app/features/executions/types";
import { genericChannel } from "@/inngest/channels/generic";

type CronTriggerData = {
    cron?: string;
};

export const cronTriggerExecutor: NodeExecutor<CronTriggerData> = async ({
    context,
    nodeId,
    publish
}) => {
    // The scheduler injects { triggerTime: string } into context

    await publish(
        genericChannel().status({
            nodeId,
            status: "success",
        }),
    );

    return context;
}
