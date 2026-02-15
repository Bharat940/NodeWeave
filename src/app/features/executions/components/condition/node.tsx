"use client";

import { Node, NodeProps, useReactFlow, Position } from "@xyflow/react";
import { useState, memo } from "react";
import { WorkflowNode } from "@/components/workflow-node";
import { NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchConditionRealtimeToken } from "./actions";
import { ConditionDialog, ConditionFormValues } from "./dialog";
import { CONDITION_CHANNEL_NAME } from "@/inngest/channels/condition";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { GitBranchIcon } from "lucide-react";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";

type ConditionNodeData = Partial<ConditionFormValues>;

type ConditionNodeType = Node<ConditionNodeData>;

export const ConditionNode = memo((props: NodeProps<ConditionNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: CONDITION_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchConditionRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: ConditionFormValues) => {
        setNodes((nodes) => nodes.map((node) => {
            if (node.id === props.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...values,
                    }
                }
            }
            return node;
        }))
    };

    const nodeData = props.data;
    const description = nodeData?.leftOperand
        ? `${nodeData.leftOperand} ${nodeData.operator} ${nodeData.rightOperand || ''}`
        : "Not Configured";

    const handleDelete = () => {
        setNodes((currentNode) => currentNode.filter((node) => node.id !== props.id));
    };

    return (
        <>
            <ConditionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <WorkflowNode
                name="Condition"
                description={description}
                onDelete={handleDelete}
                onSettings={handleOpenSetting}
            >
                <NodeStatusIndicator
                    status={nodeStatus}
                    variant="border"
                >
                    <BaseNode
                        status={nodeStatus}
                        onDoubleClick={handleOpenSetting}
                        className="w-[40px] h-[40px] flex items-center justify-center p-0"
                    >
                        {/* Icon Only */}
                        <div className="flex items-center justify-center size-full">
                            <GitBranchIcon className="size-4 text-muted-foreground" />
                        </div>

                        {/* Input Handle */}
                        <BaseHandle
                            id="target-1"
                            type="target"
                            position={Position.Left}
                        />

                        {/* True Output */}
                        <div className="absolute -right-[5px] top-2 flex items-center pointer-events-none">
                            <BaseHandle
                                id="source-true"
                                type="source"
                                position={Position.Right}
                                className="pointer-events-auto !bg-green-500 !border-green-600 size-2.5"
                            />
                            <span className="ml-2 text-[8px] font-bold text-green-600 uppercase tracking-tighter absolute left-full top-1/2 -translate-y-1/2 bg-background px-1 rounded border shadow-sm">TRUE</span>
                        </div>

                        {/* False Output */}
                        <div className="absolute -right-[5px] bottom-2 flex items-center pointer-events-none">
                            <BaseHandle
                                id="source-false"
                                type="source"
                                position={Position.Right}
                                className="pointer-events-auto !bg-red-500 !border-red-600 size-2.5"
                            />
                            <span className="ml-2 text-[8px] font-bold text-red-600 uppercase tracking-tighter absolute left-full top-1/2 -translate-y-1/2 bg-background px-1 rounded border shadow-sm">FALSE</span>
                        </div>
                    </BaseNode>
                </NodeStatusIndicator>
            </WorkflowNode>
        </>
    )
});

ConditionNode.displayName = "ConditionNode";
