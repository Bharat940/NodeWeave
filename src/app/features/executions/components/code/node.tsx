"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { CodeIcon } from "lucide-react";
import { useState, memo } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { CodeDialog, CodeFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchCodeRealtimeToken } from "./actions";
import { CODE_CHANNEL_NAME } from "@/inngest/channels/code";

type CodeNodeData = Partial<CodeFormValues>;

type CodeNodeType = Node<CodeNodeData>;

export const CodeNode = memo((props: NodeProps<CodeNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: CODE_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchCodeRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const handleSubmit = (values: CodeFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === props.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }
                return node;
            })
        );
    };

    const nodeData = props.data;
    const lineCount = nodeData?.code
        ? nodeData.code.split("\n").filter((l) => l.trim() !== "").length
        : 0;
    const description = lineCount > 0 ? `${lineCount} line(s)` : "Not Configured";

    return (
        <>
            <CodeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                icon={CodeIcon}
                name="Code"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSetting}
                onDoubleClick={handleOpenSetting}
            />
        </>
    );
});

CodeNode.displayName = "CodeNode";
