"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { delayChannel } from "@/inngest/channels/delay";
import { inngest } from "@/inngest/client";

export type DelayToken = Realtime.Token<typeof delayChannel, ["status"]>;

export async function fetchDelayRealtimeToken(): Promise<DelayToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: delayChannel(),
        topics: ["status"],
    });

    return token;
}
