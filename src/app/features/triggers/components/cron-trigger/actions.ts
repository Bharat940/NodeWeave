"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { genericChannel } from "@/inngest/channels/generic";
import { inngest } from "@/inngest/client";

export type CronTriggerToken = Realtime.Token<
    typeof genericChannel,
    ["status"]
>;

export async function fetchCronTriggerRealtimeToken(): Promise<CronTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: genericChannel(),
        topics: ["status"],
    });

    return token;
}

// Currently no server actions needed for Cron Trigger as it's fully managed 
// by the Inngest scheduler and specific node configuration.
// Kept for consistency with other trigger components.

export async function checkCronStatus() {
    return { status: "active" };
}
