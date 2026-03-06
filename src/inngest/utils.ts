import { Connection, Node, ExecutionStatus } from "@/generated/prisma/client";
import toposort from "toposort";
import { inngest } from "./client";
import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/db";

export const topologicalSort = (
    nodes: Node[],
    connections: Connection[],
): Node[] => {
    if (connections.length === 0) {
        return nodes;
    }

    const edges: [string, string][] = connections.map((conn) => [
        conn.fromNodeId,
        conn.toNodeId
    ]);

    const connectedNodeIds = new Set<string>();

    for (const conn of connections) {
        connectedNodeIds.add(conn.fromNodeId);
        connectedNodeIds.add(conn.toNodeId);
    }

    for (const node of nodes) {
        if (!connectedNodeIds.has(node.id)) {
            edges.push([node.id, node.id]);
        }
    }

    let sortedNodeIds: string[];

    try {
        sortedNodeIds = toposort(edges);

        sortedNodeIds = [...new Set(sortedNodeIds)];
    } catch (error) {
        if (error instanceof Error && error.message.includes("Cyclic")) {
            throw new Error("Workflow contains a cycle");
        }
        throw error;
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

import { workflowChannel } from "./channels/workflow-channel";

export const sendWorkflowExecution = async (
    data: {
        workflowId: string;
        triggerType?: string;
        [key: string]: any;
    }
) => {
    const eventId = createId();

    // Pre-create the execution record immediately with QUEUED status
    // This makes it visible to the user at the exact moment of trigger
    const execution = await prisma.execution.create({
        data: {
            workflowId: data.workflowId,
            inngestEventId: eventId,
            status: ExecutionStatus.QUEUED,
            triggerType: data.triggerType ?? "manual",
        },
    });

    // Broadcast QUEUED status to workflow history instantly
    // We use inngest.send here because we are outside of a function context
    await inngest.send({
        name: "workflow/execution.updated",
        data: {
            workflowId: data.workflowId,
            executionId: execution.id,
            status: ExecutionStatus.QUEUED,
        },
    });

    return inngest.send({
        name: "workflows/execute.workflow",
        data,
        id: eventId,
    });
}

interface ConnectionLike {
    fromNodeId: string;
    toNodeId: string;
    fromOutput: string;
}

export const buildAdjacencyMap = (connections: ConnectionLike[]) => {
    const adjacency = new Map<string, Map<string, string[]>>();

    for (const conn of connections) {
        if (!adjacency.has(conn.fromNodeId)) {
            adjacency.set(conn.fromNodeId, new Map());
        }

        const nodeOutputs = adjacency.get(conn.fromNodeId)!;
        if (!nodeOutputs.has(conn.fromOutput)) {
            nodeOutputs.set(conn.fromOutput, []);
        }

        nodeOutputs.get(conn.fromOutput)!.push(conn.toNodeId);
    }

    return adjacency;
};