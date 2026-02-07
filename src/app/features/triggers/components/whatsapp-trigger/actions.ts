"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { whatsappTriggerChannel } from "@/inngest/channels/whatsapp-trigger";

export type WhatsappTriggerToken = Realtime.Token<
    typeof whatsappTriggerChannel,
    ["status"]
>;

export async function fetchWhatsappTriggerRealtimeToken(): Promise<WhatsappTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: whatsappTriggerChannel(),
        topics: ["status"],
    });

    return token;
}
