"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { emailTriggerChannel } from "@/inngest/channels/email-trigger";

export type EmailTriggerToken = Realtime.Token<
    typeof emailTriggerChannel,
    ["status"]
>;

export async function fetchEmailTriggerRealtimeToken(): Promise<EmailTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: emailTriggerChannel(),
        topics: ["status"],
    });

    return token;
}
