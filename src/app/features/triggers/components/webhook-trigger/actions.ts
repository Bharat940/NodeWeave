"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { genericChannel } from "@/inngest/channels/generic";

export type GenericWebhookToken = Realtime.Token<
    typeof genericChannel,
    ["status"]
>;

export async function fetchWebhookRealtimeToken(): Promise<GenericWebhookToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: genericChannel(),
        topics: ["status"],
    });

    return token;
}
