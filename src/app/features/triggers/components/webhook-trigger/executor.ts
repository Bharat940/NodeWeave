import type { NodeExecutor } from "@/app/features/executions/types";
import { genericChannel } from "@/inngest/channels/generic";

type WebhookTriggerData = Record<string, unknown>;

export const webhookTriggerExecutor: NodeExecutor<WebhookTriggerData> = async ({
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        genericChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("webhook-trigger", async () => context);

        await publish(
            genericChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            genericChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw error;
    }
}
