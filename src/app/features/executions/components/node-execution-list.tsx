"use client";

import { ExecutionStatus } from "@/generated/prisma/browser";
import {
    CheckCircle2Icon,
    CircleDashedIcon,
    ClockIcon,
    Loader2Icon,
    XCircleIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { NodeType } from "@/generated/prisma/browser";

// Helper to map NodeType to a label or icon if needed
// For now, we use the name snapshot from the DB

interface NodeExecution {
    id: string;
    nodeId: string;
    name: string;
    type: NodeType;
    status: ExecutionStatus;
    input: any;
    output: any;
    error: string | null;
    startedAt: Date;
    completedAt: Date | null;
}

const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
        case ExecutionStatus.SUCCESS:
            return <CheckCircle2Icon className="size-4 text-green-600" />;
        case ExecutionStatus.FAILED:
            return <XCircleIcon className="size-4 text-red-600" />;
        case ExecutionStatus.RUNNING:
            return <Loader2Icon className="size-4 text-blue-600 animate-spin" />;
        default:
            return <CircleDashedIcon className="size-4 text-muted-foreground" />;
    }
}

const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
        case ExecutionStatus.SUCCESS:
            return "border-green-200 bg-green-50";
        case ExecutionStatus.FAILED:
            return "border-red-200 bg-red-50";
        case ExecutionStatus.RUNNING:
            return "border-blue-200 bg-blue-50";
        default:
            return "border-gray-200 bg-gray-50";
    }
}

const JsonViewer = ({ data, label, isError = false }: { data: any, label: string, isError?: boolean }) => {
    if (!data) return null;

    return (
        <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-medium mb-1.5", isError ? "text-red-700" : "text-muted-foreground")}>
                {label}
            </p>
            <div className={cn(
                "rounded-md border p-3 text-xs font-mono overflow-auto max-h-[300px]",
                isError ? "bg-red-50 border-red-200 text-red-900" : "bg-muted/50 text-foreground"
            )}>
                <pre className="whitespace-pre-wrap break-all">
                    {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    )
}

const NodeExecutionItem = ({ execution }: { execution: NodeExecution }) => {
    const [isOpen, setIsOpen] = useState(execution.status === ExecutionStatus.FAILED);

    const duration = execution.completedAt
        ? ((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(2)
        : null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/40",
                getStatusColor(execution.status)
            )}>
                <CollapsibleTrigger asChild>
                    <button className="p-1 hover:bg-black/5 rounded-sm transition-colors">
                        {isOpen ? (
                            <ChevronDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                            <ChevronRightIcon className="size-4 text-muted-foreground" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <div className="flex items-center justify-center p-1.5 bg-background rounded-md shadow-sm border">
                    {getStatusIcon(execution.status)}
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">
                            {execution.name}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <span>{execution.type}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
                        {duration && (
                            <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md border">
                                <ClockIcon className="size-3" />
                                <span>{duration}s</span>
                            </div>
                        )}
                        <Badge variant="outline" className={cn(
                            "capitalize shadow-none",
                            execution.status === ExecutionStatus.SUCCESS && "border-green-200 text-green-700 bg-green-100/50",
                            execution.status === ExecutionStatus.FAILED && "border-red-200 text-red-700 bg-red-100/50",
                        )}>
                            {execution.status.toLowerCase()}
                        </Badge>
                    </div>
                </div>
            </div>

            <CollapsibleContent>
                <div className="pl-12 pr-1 py-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="space-y-4">
                        {execution.error && (
                            <JsonViewer data={execution.error} label="Error Details" isError />
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <JsonViewer data={execution.input} label="Input (Context)" />
                            {execution.status === ExecutionStatus.SUCCESS && (
                                <JsonViewer data={execution.output} label="Output (Result)" />
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

export const NodeExecutionList = ({ executions }: { executions: NodeExecution[] }) => {
    if (!executions || executions.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">Execution Steps</h3>
                <Badge variant="secondary" className="rounded-full px-2.5">
                    {executions.length}
                </Badge>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[23px] before:w-px before:bg-border/50 before:-z-10">
                {/* The vertical line logic above is a simple connection line, might need tweaking for perfect alignment */}
                {executions.map((execution) => (
                    <NodeExecutionItem key={execution.id} execution={execution} />
                ))}
            </div>
        </div>
    )
}
