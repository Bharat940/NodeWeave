import Handlebars from "handlebars";
import { decode } from "html-entities"
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { slackChannel } from "@/inngest/channels/slack";
import { SlackFormValues } from "./dialog";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type SlackData = Partial<SlackFormValues>;

export const slackExecutor: NodeExecutor<SlackData> = async ({
    data,
    context,
    nodeId,
    step,
    publish
}) => {

    await publish(
        slackChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    if (!data.content) {
        await publish(
            slackChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Slack Node: Message Content is required");
    }

    const rawContent = Handlebars.compile(data.content)(context);
    const content = decode(rawContent);

    try {
        const result = await step.run("slack-webhook", async () => {
            if (!data.webhookUrl) {
                await publish(
                    slackChannel().status({
                        nodeId,
                        status: "error",
                    }),
                );
                throw new NonRetriableError("Slack node: Webhook URL is required");
            }

            await ky.post(data.webhookUrl!, {
                json: {
                    content: content,
                }
            });

            if (!data.variableName) {
            await publish(
                    slackChannel().status({
                        nodeId,
                        status: "error"
                    }),
                );
                throw new NonRetriableError("Slack Node: Variable name is missing");
            }

            return {
                ...context,
                [data.variableName]: {
                    messageContent: content.slice(0, 2000),
                },
            }
        })

        await publish(
            slackChannel().status({
                nodeId,
                status: "success"
            }),
        );

        return result
    } catch (error) {
        await publish(
            slackChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw error;
    }
}