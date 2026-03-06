"use client";

import { ExecutionStatus } from "@/generated/prisma/browser";
import { CheckCircle2Icon, ClockIcon, LoaderCircle, RefreshCwIcon, WifiIcon, XCircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSuspenseExecution } from "../hooks/use-executions";
import { NodeExecutionList } from "./node-execution-list";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useExecutionRealtime } from "../hooks/use-execution-realtime";
import { fetchExecutionRealtimeToken } from "../actions";
import { ExecutionStatusIcon } from "./execution-status-icon";


const formatStatus = (status: ExecutionStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionView = ({
    executionId
}: {
    executionId: string
}) => {
    const trpc = useTRPC();
    const router = useRouter();
    const { data: execution } = useSuspenseExecution(executionId);
    const [showStackTrace, setShowStackTrace] = useState(false);

    const isRunning = execution.status === ExecutionStatus.RUNNING;

    // Stable refreshToken callback — avoids re-subscribing on every render
    const refreshToken = useCallback(
        () => fetchExecutionRealtimeToken(executionId),
        [executionId]
    );

    // Subscribe to live node updates while this execution is running
    const { state: realtimeState } = useExecutionRealtime({
        executionId,
        isRunning,
        refreshToken,
    });

    const isLive = isRunning && realtimeState === "active";

    const rerunMutation = useMutation(
        trpc.executions.rerun.mutationOptions({
            onSuccess: () => {
                toast.success("Workflow re-triggered", {
                    description: "A new execution has started.",
                });
                router.push("/executions");
            },
            onError: (err) => {
                toast.error("Re-run failed", {
                    description: err.message,
                });
            },
        })
    );

    const duration = execution.completedAt
        ? Math.round(
            (new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000,
        ) : null;

    return (
        <Card className="shadow-none">
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ExecutionStatusIcon status={execution.status} size={5} />
                        <div>
                            <CardTitle>
                                {formatStatus(execution.status)}
                            </CardTitle>
                            <CardDescription>
                                Execution for {execution.workflow.name}
                            </CardDescription>
                        </div>
                        {/* Live badge: shown when Inngest Realtime connection is active */}
                        {isLive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 animate-pulse">
                                <WifiIcon className="size-3" />
                                Live
                            </span>
                        )}
                    </div>

                    {execution.status !== ExecutionStatus.RUNNING && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={rerunMutation.isPending}
                            onClick={() => rerunMutation.mutate({ id: executionId })}
                        >
                            {rerunMutation.isPending ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <RefreshCwIcon className="size-4" />
                            )}
                            Re-run
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Workflow
                        </p>
                        <Link
                            prefetch
                            className="text-sm hover:underline text-primary"
                            href={`/workflows/${execution.workflowId}`}
                        >
                            {execution.workflow.name}
                        </Link>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className="text-sm">{formatStatus(execution.status)}</p>
                    </div>

                    {execution.triggerType && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Trigger</p>
                            <p className="text-sm capitalize">{execution.triggerType}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Started</p>
                        <p className="text-sm">{formatDistanceToNow(execution.startedAt, { addSuffix: true })}</p>
                    </div>
                    {execution.completedAt ? (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                            <p className="text-sm">{formatDistanceToNow(execution.completedAt, { addSuffix: true })}</p>
                        </div>
                    ) : null}

                    {duration !== null ? (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Duration</p>
                            <p className="text-sm">{duration}s</p>
                        </div>
                    ) : null}

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Event ID</p>
                        <p className="text-sm truncate">{execution.inngestEventId}</p>
                    </div>
                </div>

                {execution.error && (
                    <div className="mt-6 p-4 bg-red-50 rounded-md space-y-3">
                        <div>
                            <p className="text-sm font-medium text-red-900 mb-2">
                                Error
                            </p>
                            <p className="text-sm text-red-800 font-mono">
                                {execution.error}
                            </p>
                        </div>

                        {execution.errorStack && (
                            <Collapsible
                                open={showStackTrace}
                                onOpenChange={setShowStackTrace}
                            >
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-900 hover:bg-red-100"
                                    >
                                        {showStackTrace
                                            ? "Hide stack trace"
                                            : "Show stack trace"
                                        }
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <pre className="text-xs font-mono text-red-800 whitespace-pre-wrap break-all mt-2 p-2 bg-red-100">
                                        {execution.errorStack}
                                    </pre>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                )}

                <div className="py-2">
                    <NodeExecutionList executions={execution.nodeExecutions} />
                </div>

                {execution.output && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">
                            Output
                        </p>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(execution.output, null, 2)}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    )
};