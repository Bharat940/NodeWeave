"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { githubChannel } from "@/inngest/channels/github";

export type GitHubToken = Realtime.Token<
    typeof githubChannel,
    ["status"]
>;

export async function fetchGitHubRealtimeToken(): Promise<GitHubToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: githubChannel(),
        topics: ["status"],
    });

    return token;
}
