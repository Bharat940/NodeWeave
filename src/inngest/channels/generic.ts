import { channel, topic } from "@inngest/realtime";

export const GENERIC_CHANNEL_NAME = "generic-execution"

export const genericChannel = channel(GENERIC_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
        }>(),
    );
