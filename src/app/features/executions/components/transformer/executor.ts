import Handlebars from "handlebars";
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { transformerChannel } from "@/inngest/channels/transformer";
import { TransformerFormValues } from "./dialog";

Handlebars.registerHelper("json", (context) => {
    return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type TransformRule = {
    outputKey: string;
    expression: string;
};

type TransformerData = Partial<TransformerFormValues>;

export const transformerExecutor: NodeExecutor<TransformerData> = async ({
    data,
    context,
    nodeId,
    step,
    publish,
}) => {
    await publish(
        transformerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    if (!data.variableName) {
        await publish(
            transformerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw new NonRetriableError("Transformer Node: Variable name is missing");
    }

    if (!data.rules || data.rules.length === 0) {
        await publish(
            transformerChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw new NonRetriableError("Transformer Node: At least one rule is required");
    }

    try {
        const result = await step.run("transform", async () => {
            const output: Record<string, unknown> = {};

            for (const rule of data.rules as TransformRule[]) {
                if (!rule.outputKey) continue;

                const compiled = Handlebars.compile(rule.expression ?? "")(context);
                output[rule.outputKey] = compiled;
            }

            return {
                ...context,
                [data.variableName!]: output,
            };
        });

        await publish(
            transformerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            transformerChannel().status({
                nodeId,
                status: "error",
            }),
        );

        throw error;
    }
};
