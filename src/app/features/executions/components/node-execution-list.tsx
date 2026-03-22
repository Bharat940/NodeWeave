"use client";

import { ExecutionStatus, NodeType } from "@/generated/prisma/browser";
import {
    ClockIcon,
    ClipboardIcon,
    ClipboardCheckIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { ExecutionStatusIcon } from "./execution-status-icon";

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

const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
        case ExecutionStatus.SUCCESS:
            return "border-emerald-500/30 bg-emerald-500/10";
        case ExecutionStatus.FAILED:
            return "border-destructive/30 bg-destructive/10";
        case ExecutionStatus.RUNNING:
            return "border-blue-500 bg-blue-500/20 animate-pulse";
        default:
            return "border-amber-500/30 bg-amber-500/10";
    }
}

/** Copy-to-clipboard button — shows a checkmark for 2s after copying */
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [text]);

    return (
        <button
            onClick={copy}
            className="ml-auto p-1 rounded-sm hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground dark:hover:bg-white/10"
            title="Copy to clipboard"
        >
            {copied
                ? <ClipboardCheckIcon className="size-3.5 text-primary" />
                : <ClipboardIcon className="size-3.5" />
            }
        </button>
    );
};

const JsonViewer = ({ data, label, isError = false }: { data: any, label: string, isError?: boolean }) => {
    if (data === null || data === undefined) return null;

    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);

    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1.5">
                <p className={cn("text-xs font-medium", isError ? "text-destructive" : "text-muted-foreground")}>
                    {label}
                </p>
                <CopyButton text={text} />
            </div>
            <div className={cn(
                "rounded-md border p-3 text-xs font-mono overflow-auto max-h-[300px]",
                isError ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-muted/30 border-border/50 text-foreground"
            )}>
                <pre className="whitespace-pre-wrap break-all">{text}</pre>
            </div>
        </div>
    );
};

const NodeExecutionItem = ({ execution }: { execution: NodeExecution }) => {
    const [isOpen, setIsOpen] = useState(execution.status === ExecutionStatus.FAILED);

    const duration = execution.completedAt
        ? ((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(2)
        : null;

    // Absolute timestamp shown on hover for precise debugging
    const absoluteTime = format(new Date(execution.startedAt), "PPpp");

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/40",
                getStatusColor(execution.status)
            )}>
                <CollapsibleTrigger asChild>
                    <button className="p-1 hover:bg-accent/40 rounded-sm transition-colors">
                        {isOpen ? (
                            <ChevronDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                            <ChevronRightIcon className="size-4 text-muted-foreground" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <div className="flex items-center justify-center size-7 bg-background rounded-md shadow-sm border shrink-0">
                    <ExecutionStatusIcon status={execution.status} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                            {execution.name}
                        </span>
                        <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground gap-1.5 sm:gap-2">
                            <span className="truncate">{execution.type}</span>
                            <span>•</span>
                            <span title={absoluteTime} className="truncate">
                                {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                        {duration && (
                            <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md border">
                                <ClockIcon className="size-3" />
                                <span>{duration}s</span>
                            </div>
                        )}
                        <Badge variant="outline" className={cn(
                            "capitalize shadow-none border-border/50 bg-background/50",
                            execution.status === ExecutionStatus.SUCCESS && "border-emerald-500/40 text-emerald-600 bg-emerald-500/10",
                            execution.status === ExecutionStatus.FAILED && "border-destructive/40 text-destructive bg-destructive/10",
                        )}>
                            {execution.status.toLowerCase()}
                        </Badge>
                    </div>
                </div>
            </div>

            <CollapsibleContent>
                <div className="pl-8 sm:pl-12 pr-1 py-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="space-y-4">
                        {execution.error && (
                            <JsonViewer data={execution.error} label="Error Details" isError />
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <JsonViewer data={execution.input} label="Input (Context)" />
                            {/* Show output for both SUCCESS and FAILED — partial output on failure aids debugging */}
                            {execution.output && (
                                <JsonViewer data={execution.output} label="Output (Result)" />
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

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

            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[19px] sm:before:ml-[23px] before:w-px before:bg-border/50 before:-z-10">
                {executions.map((execution) => (
                    <NodeExecutionItem key={execution.id} execution={execution} />
                ))}
            </div>
        </div>
    );
};
