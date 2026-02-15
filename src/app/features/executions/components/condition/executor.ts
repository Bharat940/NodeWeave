import Handlebars from "handlebars";
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { conditionChannel } from "@/inngest/channels/condition";
import { ConditionFormValues } from "./dialog";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type ConditionData = Partial<ConditionFormValues>;

export const conditionExecutor: NodeExecutor<ConditionData> = async ({
    data,
    context,
    userId,
    nodeId,
    step,
    publish
}) => {

    await publish(
        conditionChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    if (!data.variableName) {
        await publish(
            conditionChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Condition Node: Variable name is missing");
    }

    if (!data.leftOperand) {
        await publish(
            conditionChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Condition Node: Left operand is missing");
    }

    if (!data.operator) {
        await publish(
            conditionChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Condition Node: Operator is missing");
    }

    const leftOperand = Handlebars.compile(data.leftOperand)(context);
    const rightOperand = data.rightOperand
        ? Handlebars.compile(data.rightOperand)(context)
        : undefined;

    let result: boolean;

    switch (data.operator) {
        case "equals":
            result = leftOperand === rightOperand;
            break;
        case "not_equals":
            result = leftOperand !== rightOperand;
            break;
        case "contains":
            result = leftOperand.includes(rightOperand || "");
            break;
        case "not_contains":
            result = !leftOperand.includes(rightOperand || "");
            break;
        case "greater_than":
            result = parseFloat(leftOperand) > parseFloat(rightOperand || "0");
            break;
        case "less_than":
            result = parseFloat(leftOperand) < parseFloat(rightOperand || "0");
            break;
        case "is_empty":
            result = leftOperand === "";
            break;
        case "is_not_empty":
            result = leftOperand !== "";
            break;
        case "starts_with":
            result = leftOperand.startsWith(rightOperand || "");
            break;
        case "ends_with":
            result = leftOperand.endsWith(rightOperand || "");
            break;
        default:
            result = false;
    }

    await publish(
        conditionChannel().status({
            nodeId,
            status: "success"
        }),
    );

    return {
        ...context,
        [data.variableName]: {
            result,
        },
        // Internal flow control
        __conditionResult: result,
        __conditionNodeId: nodeId,
    };
}