import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma/client";
import { getExecutor } from "@/app/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/mannual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { whatsappChannel } from "./channels/whatsapp";
import { whatsappTriggerChannel } from "./channels/whatsapp-trigger";
import { telegramChannel } from "./channels/telegram";
import { telegramTriggerChannel } from "./channels/telegram-trigger";
import { emailChannel } from "./channels/email";
import { conditionChannel } from "./channels/condition";
import { buildAdjacencyMap } from "./utils";

export const executeWorkflow = inngest.createFunction(
    {
        id: "execute-workflow",
        retries: 0, // TODO remove in production
        onFailure: async ({ event, step }) => {
            return prisma.execution.update({
                where: { inngestEventId: event.data.event.id },
                data: {
                    status: ExecutionStatus.FAILED,
                    error: event.data.error.message,
                    errorStack: event.data.error.stack,
                },
            });
        },
    },
    {
        event: "workflows/execute.workflow",
        channels: [
            httpRequestChannel(),
            manualTriggerChannel(),
            googleFormTriggerChannel(),
            stripeTriggerChannel(),
            geminiChannel(),
            openAiChannel(),
            anthropicChannel(),
            discordChannel(),
            slackChannel(),
            whatsappChannel(),
            whatsappTriggerChannel(),
            telegramChannel(),
            telegramTriggerChannel(),
            emailChannel(),
            conditionChannel(),
        ],
    },
    async ({ event, step, publish }) => {
        const inngestEventId = event.id;
        const workflowId = event.data.workflowId;

        if (!inngestEventId) {
            throw new NonRetriableError("Event ID is missing");
        }

        if (!workflowId) {
            throw new NonRetriableError("Workflow ID is missing");
        }

        await step.run("create-execution", async () => {
            return prisma.execution.create({
                data: {
                    workflowId,
                    inngestEventId,
                },
            });
        });

        const { sortedNodes, connections } = await step.run("prepare-workflow", async () => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: { id: workflowId },
                include: {
                    nodes: true,
                    connections: true,
                },
            });

            return {
                sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
                connections: workflow.connections
            };
        });

        const userId = await step.run("find-user-id", async () => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: { id: workflowId },
                select: {
                    userId: true,
                },
            });

            return workflow.userId;
        })

        let context = event.data.initialData || {};

        // Build adjacency map
        const adjacency = buildAdjacencyMap(connections);

        // Initialize executable nodes with roots (nodes with no incoming connections)
        const incomingConnections = new Set(connections.map((c) => c.toNodeId));
        const executableNodes = new Set(
            sortedNodes
                .filter((node) => !incomingConnections.has(node.id))
                .map((node) => node.id)
        );

        for (const node of sortedNodes) {
            // Skip nodes that haven't been enabled by a parent
            if (!executableNodes.has(node.id)) {
                continue;
            }

            const executor = getExecutor(node.type as NodeType);
            context = await executor({
                data: node.data as Record<string, unknown>,
                nodeId: node.id,
                userId,
                context,
                step,
                publish
            });

            // Activate children based on execution result
            const nodeOutputs = adjacency.get(node.id);
            if (nodeOutputs) {
                if (node.type === NodeType.CONDITION) {
                    // Branching logic: only activate the path matching the result
                    const result = context.__conditionResult as boolean;
                    const outputToEnable = result ? "source-true" : "source-false";

                    const targets = nodeOutputs.get(outputToEnable);
                    if (targets) {
                        targets.forEach((targetId) => executableNodes.add(targetId));
                    }

                    // Clean up internal keys
                    delete context.__conditionResult;
                    delete context.__conditionNodeId;
                } else {
                    // Standard logic: activate all children
                    for (const targets of nodeOutputs.values()) {
                        targets.forEach((targetId) => executableNodes.add(targetId));
                    }
                }
            }
        }

        await step.run("update-execution", async () => {
            return prisma.execution.update({
                where: { inngestEventId, workflowId },
                data: {
                    status: ExecutionStatus.SUCCESS,
                    completedAt: new Date(),
                    output: context,
                },
            });
        });

        return {
            workflowId,
            result: context,
        };
    },
);