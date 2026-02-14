import type { NodeExecutor } from "@/app/features/executions/types";
import { emailTriggerChannel } from "@/inngest/channels/email-trigger";

type EmailTriggerData = Record<string, unknown>;

export const emailTriggerExecutor: NodeExecutor<EmailTriggerData> = async ({
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        emailTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("email-trigger", async () => context);

        await publish(
            emailTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            emailTriggerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw error;
    }
}
