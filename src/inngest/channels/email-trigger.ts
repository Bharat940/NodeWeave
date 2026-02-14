import { channel, topic } from "@inngest/realtime";

export const EMAIL_TRIGGER_CHANNEL_NAME = "email-trigger-execution"

export const emailTriggerChannel = channel(EMAIL_TRIGGER_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
        }>(),
    );
