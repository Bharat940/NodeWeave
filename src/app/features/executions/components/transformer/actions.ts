"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { transformerChannel } from "@/inngest/channels/transformer";

export type TransformerToken = Realtime.Token<
    typeof transformerChannel,
    ["status"]
>;

export async function fetchTransformerRealtimeToken(): Promise<TransformerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: transformerChannel(),
        topics: ["status"],
    });

    return token;
}
