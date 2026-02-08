"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { githubTriggerChannel } from "@/inngest/channels/github-trigger";

export type GitHubTriggerToken = Realtime.Token<
    typeof githubTriggerChannel,
    ["status"]
>;

export async function fetchGitHubTriggerRealtimeToken(): Promise<GitHubTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: githubTriggerChannel(),
        topics: ["status"],
    });

    return token;
}
