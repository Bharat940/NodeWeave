"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { conditionChannel } from "@/inngest/channels/condition";

export type ConditionToken = Realtime.Token<
    typeof conditionChannel,
    ["status"]
>;

export async function fetchConditionRealtimeToken(): Promise<ConditionToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: conditionChannel(),
        topics: ["status"],
    });

    return token;
}