"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useWorkflowUsage } from "../hooks/use-workflow-usage";
import { authClient } from "@/lib/auth-client";
import { trackWorkflowLimitEvent, WORKFLOW_LIMIT_EVENTS } from "@/lib/analytics";
import { ErrorBoundary } from "react-error-boundary";

const WorkflowUsageContent = () => {
    const {
        workflowCount,
        maxWorkflows,
        activeWorkflowsCount,
        maxActiveWorkflows,
        executionsCount,
        maxExecutions,
        workflowUsagePercentage,
        executionUsagePercentage,
        isNearWorkflowLimit,
        isAtWorkflowLimit,
        isNearExecutionLimit,
        isAtExecutionLimit,
        isPremium,
        isSubscriptionLoading
    } = useWorkflowUsage();

    // Don't show while loading subscription status or for premium users
    if (isSubscriptionLoading || isPremium) {
        return null;
    }

    const getProgressColor = (isAt: boolean, isNear: boolean) => {
        if (isAt) return "bg-red-500";
        if (isNear) return "bg-yellow-500";
        return "bg-blue-500";
    };

    const handleUpgrade = (source: string) => {
        trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.UPGRADE_CLICKED_FROM_WARNING, {
            source,
            workflowCount,
        });
        authClient.checkout({ slug: "pro" });
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300 border rounded-lg p-4 bg-card/50">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="size-4 text-blue-500" />
                    Free Tier Usage
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpgrade('header')}
                    className="h-7 text-xs"
                >
                    Upgrade to Pro
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workflows Usage */}
                <div className="space-y-2">
                    <div className="flex flex-row flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-muted-foreground font-medium">Workflows</span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className="text-foreground font-semibold">
                                {workflowCount} / {maxWorkflows}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
                                {activeWorkflowsCount} Active
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <Progress value={workflowUsagePercentage} className="h-1.5" />
                        <div
                            className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${getProgressColor(isAtWorkflowLimit, isNearWorkflowLimit)}`}
                            style={{ width: `${workflowUsagePercentage}%` }}
                        />
                    </div>
                </div>

                {/* Executions Usage */}
                <div className="space-y-2">
                    <div className="flex flex-row flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-muted-foreground font-medium">Monthly Executions</span>
                        <span className="text-foreground font-semibold">
                            {executionsCount} / {maxExecutions}
                        </span>
                    </div>
                    <div className="relative">
                        <Progress value={executionUsagePercentage} className="h-1.5" />
                        <div
                            className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${getProgressColor(isAtExecutionLimit, isNearExecutionLimit)}`}
                            style={{ width: `${executionUsagePercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Warnings Container */}
            {(isNearWorkflowLimit || isNearExecutionLimit || isAtWorkflowLimit || isAtExecutionLimit) && (
                <div className="pt-1">
                    {isAtExecutionLimit ? (
                        <Alert variant="destructive" className="py-2 px-3 flex flex-row items-center gap-2 border-red-500/20 bg-red-500/5">
                            <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                            <div className="text-xs text-red-600 flex items-center gap-1 flex-wrap">
                                <span>Monthly quota hit.</span>
                                <button onClick={() => handleUpgrade('execution_limit')} className="underline font-semibold whitespace-nowrap">Upgrade</button>
                                <span>to continue running workflows.</span>
                            </div>
                        </Alert>
                    ) : isAtWorkflowLimit ? (
                        <Alert variant="destructive" className="py-2 px-3 flex flex-row items-center gap-2 border-red-500/20 bg-red-500/5">
                            <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                            <div className="text-xs text-red-600 flex items-center gap-1 flex-wrap">
                                <span>Workflow limit reached.</span>
                                <button onClick={() => handleUpgrade('workflow_limit')} className="underline font-semibold whitespace-nowrap">Upgrade</button>
                                <span>to create more.</span>
                            </div>
                        </Alert>
                    ) : (isNearExecutionLimit || isNearWorkflowLimit) && (
                        <Alert variant="default" className="py-2 px-3 flex flex-row items-center gap-2 border-yellow-500/20 bg-yellow-500/5">
                            <AlertTriangle className="size-3.5 text-yellow-600 shrink-0" />
                            <div className="text-xs text-yellow-700 flex items-center gap-1 flex-wrap">
                                <span>Approaching your free tier limits.</span>
                                <button onClick={() => handleUpgrade('near_limit')} className="underline font-semibold whitespace-nowrap">Upgrade to Pro</button>
                                <span>for unlimited access.</span>
                            </div>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
};

export const WorkflowUsageDisplay = () => {
    return (
        <ErrorBoundary
            fallback={null}
            onError={(error) => {
                // Silently fail - don't show usage display if there's an error
                console.error('WorkflowUsageDisplay error:', error);
            }}
        >
            <WorkflowUsageContent />
        </ErrorBoundary>
    );
};
