import Handlebars from "handlebars";
import { decode } from "html-entities"
import type { NodeExecutor } from "@/app/features/executions/types";
import ky, { type Options as KyOptions } from "ky";
import { NonRetriableError } from "inngest";
import { telegramChannel } from "@/inngest/channels/telegram";
import { TelegramFormValues } from "./dialog";

type TelegramData = Partial<TelegramFormValues>;

export const telegramExecutor: NodeExecutor<TelegramData> = async ({
    data,
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        telegramChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    if (!data.content) {
        await publish(
            telegramChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Telegram Node: Message content is required");
    }

    if (!data.variableName) {
        await publish(
            telegramChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Telegram Node: Variable name is required");
    }

    // Compile message content with Handlebars
    const rawContent = Handlebars.compile(data.content)(context);
    const content = decode(rawContent).trim();

    if (!content) {
        await publish(
            telegramChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError(`Telegram Node: The message content resulted in an empty string. Please check your variables (e.g., use {{Test.text}} instead of {{ai.text}}).`);
    }

    try {
        const result = await step.run("telegram-execution", async () => {
            if (!data.botToken) {
                await publish(
                    telegramChannel().status({
                        nodeId,
                        status: "error",
                    }),
                );
                throw new NonRetriableError("Telegram Node: Bot token is required");
            }

            if (!data.chatId) {
                await publish(
                    telegramChannel().status({
                        nodeId,
                        status: "error",
                    }),
                );
                throw new NonRetriableError("Telegram Node: Chat ID is required");
            }

            const compiledChatId = data.chatId ? Handlebars.compile(data.chatId)(context) : data.chatId;

            const sendRequest = async (parseMode?: string) => {
                const options: KyOptions = {
                    method: "POST",
                    json: {
                        chat_id: compiledChatId,
                        text: content.slice(0, 4096),
                        parse_mode: parseMode,
                    },
                    throwHttpErrors: false
                };

                const response = await ky(
                    `https://api.telegram.org/bot${data.botToken}/sendMessage`,
                    options
                );

                return await response.json<{
                    ok: boolean;
                    description?: string;
                    error_code?: number;
                    result: {
                        message_id: number;
                        date: number;
                        chat: { id: number; type: string };
                        text: string;
                    };
                }>();
            };

            // First attempt with Markdown
            let responseData = await sendRequest("Markdown");

            // If Markdown fails (status 400), try again without Markdown
            if (!responseData.ok && responseData.error_code === 400 && responseData.description?.includes("can't parse entities")) {
                console.warn("Telegram Node: Markdown parsing failed, retrying as plain text...", responseData.description);
                responseData = await sendRequest();
            }

            if (!responseData.ok) {
                await publish(
                    telegramChannel().status({
                        nodeId,
                        status: "error",
                    }),
                );
                console.error("Telegram API Error Response:", responseData);
                throw new NonRetriableError(`Telegram Node Error: ${responseData.description || "Failed to send message"} (${responseData.error_code})`);
            }

            return {
                ...context,
                [data.variableName!]: {
                    messageId: responseData.result.message_id,
                    date: responseData.result.date,
                    chat: responseData.result.chat,
                    text: responseData.result.text,
                },
            };
        });

        await publish(telegramChannel().status({
            nodeId,
            status: "success"
        }));

        return result;
    } catch (error) {
        await publish(
            telegramChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw error;
    }
}