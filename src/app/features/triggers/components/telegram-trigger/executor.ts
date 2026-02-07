import type { NodeExecutor } from "@/app/features/executions/types";
import { telegramTriggerChannel } from "@/inngest/channels/telegram-trigger";

type TelegramTriggerData = Record<string, unknown>;

export const telegramTriggerExecutor: NodeExecutor<TelegramTriggerData> = async ({
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        telegramTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("telegram-trigger", async () => context);

        await publish(
            telegramTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            telegramTriggerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw error;
    }
}
