import { channel, topic } from "@inngest/realtime";

export const TRANSFORMER_CHANNEL_NAME = "transformer-execution";

export const transformerChannel = channel(TRANSFORMER_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
        }>(),
    );
