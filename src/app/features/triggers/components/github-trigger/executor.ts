import type { NodeExecutor } from "@/app/features/executions/types";
import { githubTriggerChannel } from "@/inngest/channels/github-trigger";

type GitHubTriggerData = Record<string, unknown>;

export const githubTriggerExecutor: NodeExecutor<GitHubTriggerData> = async ({
    context,
    nodeId,
    step,
    publish
}) => {
    await publish(
        githubTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("github-trigger", async () => context);

        await publish(
            githubTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            githubTriggerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw error;
    }
}
