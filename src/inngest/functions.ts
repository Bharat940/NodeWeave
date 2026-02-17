import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { genericChannel } from "@/inngest/channels/generic";
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
import { cronTriggerChannel } from "./channels/cron-trigger";
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
            genericChannel(),
            cronTriggerChannel(),
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

        const execution = await step.run("create-execution", async () => {
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
        const rootNodes = sortedNodes.filter((node) => !incomingConnections.has(node.id));

        const executableNodes = new Set<string>();

        // Determine which root nodes to start based on event data
        if (event.data.triggerType === 'cron') {
            // Only start CRON_TRIGGER nodes
            rootNodes.forEach(node => {
                if (node.type === NodeType.CRON_TRIGGER) {
                    executableNodes.add(node.id);
                }
            });
        } else {
            // Default behavior: start all root nodes (e.g. manual trigger, HTTP request)
            // TODO: We should probably be more specific here too for other trigger types in the future
            rootNodes.forEach(node => {
                executableNodes.add(node.id);
            });
        }

        for (const node of sortedNodes) {
            // Skip nodes that haven't been allowed by parent logic
            if (!executableNodes.has(node.id)) {
                continue;
            }

            // 1. Log START of node execution
            await step.run(`start-node-${node.id}`, async () => {
                return prisma.nodeExecution.create({
                    data: {
                        executionId: execution.id,
                        nodeId: node.id,
                        name: (node.data as Record<string, unknown>)?.label as string || node.id,
                        type: node.type as NodeType,
                        status: ExecutionStatus.RUNNING,
                        input: context,
                        startedAt: new Date(),
                    },
                });
            });

            const executor = getExecutor(node.type as NodeType);

            try {
                // 2. Execute the node logic
                const result = await executor({
                    data: (node.data as Record<string, unknown>) || {},
                    nodeId: node.id,
                    userId,
                    context,
                    step,
                    publish
                });

                // Update context with result
                context = result;

                // 3. Log SUCCESS
                await step.run(`complete-node-${node.id}`, async () => {
                    return prisma.nodeExecution.updateMany({
                        where: {
                            executionId: execution.id,
                            nodeId: node.id,
                        },
                        data: {
                            status: ExecutionStatus.SUCCESS,
                            output: context,
                            completedAt: new Date(),
                        },
                    });
                });

            } catch (error: unknown) {
                // 4. Log FAILURE
                await step.run(`fail-node-${node.id}`, async () => {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    return prisma.nodeExecution.updateMany({
                        where: {
                            executionId: execution.id,
                            nodeId: node.id,
                        },
                        data: {
                            status: ExecutionStatus.FAILED,
                            error: errorMessage,
                            completedAt: new Date(),
                        },
                    });
                });

                // Re-throw so Inngest handles the workflow failure
                throw error;
            }

            // Activate children based on execution result
            const nodeOutputs = adjacency.get(node.id);
            if (nodeOutputs) {
                // ... logic to enable next nodes ...
                const currentNodeType = node.type as NodeType;

                if (currentNodeType === NodeType.CONDITION) {
                    // Branching logic: only activate the path matching the result
                    // The Condition Executor writes to specific keys in context
                    // We assume context has the result from the executor above

                    // NOTE: Condition executor needs to return something we can read here.
                    // The previous code relied on context.__conditionResult.
                    // Let's assume the executor ensures this property exists on the returned context.

                    const result = (context as Record<string, unknown>).__conditionResult as boolean;
                    const outputToEnable = result ? "source-true" : "source-false";

                    const targets = nodeOutputs.get(outputToEnable);
                    if (targets) {
                        targets.forEach((targetId) => executableNodes.add(targetId));
                    }

                    // Clean up internal keys if needed, though keeping them in context/logs might be useful for debug
                    // delete context.__conditionResult;
                    // delete context.__conditionNodeId;
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
                    output: context as any, // Only casting final output to avoid DB JSON type issues if strictly typed
                },
            });
        });

        return {
            workflowId,
            result: context,
        };
    },
);

export { scheduler } from "./functions/scheduler";