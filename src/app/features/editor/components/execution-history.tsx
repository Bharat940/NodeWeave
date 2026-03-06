"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ClockIcon, ExternalLinkIcon, LoaderCircle, XCircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { ExecutionStatus } from "@/generated/prisma/browser";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExecutionStatusIcon } from "../../executions/components/execution-status-icon";

import { useWorkflowExecutionsRealtime } from "../../executions/hooks/use-workflow-executions-realtime";
import { fetchWorkflowRealtimeToken } from "../../executions/actions";

export const ExecutionHistoryButton = ({ workflowId }: { workflowId: string }) => {
    const trpc = useTRPC();
    const [isOpen, setIsOpen] = useState(false);

    const refreshToken = useCallback(() => fetchWorkflowRealtimeToken(workflowId), [workflowId]);

    // Live sync for history updates
    useWorkflowExecutionsRealtime({
        workflowId,
        refreshToken,
    });

    const { data: executions, isLoading, isError, refetch } = useQuery({
        ...trpc.executions.getMany.queryOptions({
            workflowId,
            pageSize: 20,
        }),
        // Keep polling as a fallback, but realtime will handle the "instant" feeling
        refetchInterval: (query) => {
            const hasActive = query.state.data?.items.some(
                item => item.status === ExecutionStatus.QUEUED || item.status === ExecutionStatus.RUNNING
            );
            return hasActive ? 1000 : 5000;
        },
    });

    // Immediately refetch when the sheet opens so the list is never stale
    useEffect(() => {
        if (isOpen) {
            refetch();
        }
    }, [isOpen, refetch]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex">
                    <ClockIcon className="size-4 mr-2" />
                    History
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Execution History</SheetTitle>
                    <SheetDescription>
                        Recent executions for this workflow.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto mt-6 -mr-6 pr-6">
                    {isLoading && !executions ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                            <LoaderCircle className="size-8 animate-spin" />
                            <p>Loading history...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-red-600/80">
                            <XCircleIcon className="size-8" />
                            <p>Failed to load history</p>
                        </div>
                    ) : executions?.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                            <ClockIcon className="size-8 opacity-20" />
                            <p>No executions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {executions?.items.map((execution) => {
                                const duration = execution.completedAt
                                    ? ((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(1)
                                    : null;

                                return (
                                    <div
                                        key={execution.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "size-8 rounded-full flex items-center justify-center bg-muted",
                                                execution.status === ExecutionStatus.RUNNING && "bg-blue-100 ring-2 ring-blue-100 ring-offset-2"
                                            )}>
                                                <ExecutionStatusIcon status={execution.status} />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {execution.status === ExecutionStatus.RUNNING ? (
                                                            <span className="flex items-center gap-2 text-blue-600">
                                                                Running
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            execution.status
                                                        )}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {duration && (
                                                <Badge variant="secondary" className="font-mono text-[10px] font-normal">
                                                    {duration}s
                                                </Badge>
                                            )}

                                            <Link
                                                href={`/executions/${execution.id}`}
                                                target="_blank"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-background rounded-md border shadow-sm"
                                            >
                                                <ExternalLinkIcon className="size-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
