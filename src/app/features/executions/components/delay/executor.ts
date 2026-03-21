import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { delayChannel } from "@/inngest/channels/delay";

type DelayData = {
    delayValue?: number;
    delayUnit?: "seconds" | "minutes" | "hours" | "days";
};

const unitToMs: Record<NonNullable<DelayData["delayUnit"]>, number> = {
    seconds: 1_000,
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
};

export const delayExecutor: NodeExecutor<DelayData> = async ({
    data,
    context,
    nodeId,
    step,
    publish,
}) => {
    await publish(
        delayChannel().status({ nodeId, status: "loading" }),
    );

    const { delayValue, delayUnit = "seconds" } = data;

    if (!delayValue || delayValue <= 0) {
        await publish(
            delayChannel().status({ nodeId, status: "error" }),
        );
        throw new NonRetriableError("Delay node: Duration must be greater than 0");
    }

    const ms = delayValue * unitToMs[delayUnit];

    // Signal that we are about to sleep
    await publish(
        delayChannel().status({ nodeId, status: "sleeping" }),
    );

    // Inngest suspends the function here — no server thread is blocked.
    // This is durable: resumes after server restarts, works inside cron workflows.
    await step.sleep(`delay-${nodeId}`, ms);

    await publish(
        delayChannel().status({ nodeId, status: "success" }),
    );

    // Passthrough: delay nodes do not modify the workflow context
    return context;
};
