import type { NodeExecutor } from "@/app/features/executions/types";
import { whatsappTriggerChannel } from "@/inngest/channels/whatsapp-trigger";

type WhatsappTriggerData = Record<string, unknown>;

export const whatsappTriggerExecutor: NodeExecutor<WhatsappTriggerData> = async ({
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        whatsappTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("whatsapp-trigger", async () => context);

        await publish(
            whatsappTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            whatsappTriggerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw error;
    }
}
