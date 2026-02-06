"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { manualTriggerChannel } from "@/inngest/channels/mannual-trigger";
import { inngest } from "@/inngest/client";

export type ManualRequestToken = Realtime.Token<
    typeof manualTriggerChannel,
    ["status"]
>;

export async function fetchManualTriggerRealtimeToken(): Promise<ManualRequestToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: manualTriggerChannel(),
        topics: ["status"],
    });

    return token;
}