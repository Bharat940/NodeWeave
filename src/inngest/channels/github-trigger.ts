import { channel, topic } from "@inngest/realtime";

export const GITHUB_TRIGGER_CHANNEL_NAME = "github-trigger-execution"

export const githubTriggerChannel = channel(GITHUB_TRIGGER_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
        }>(),
    );
