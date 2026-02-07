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
        remainingWorkflows,
        usagePercentage,
        isNearLimit,
        isAtLimit,
        isPremium,
        isSubscriptionLoading
    } = useWorkflowUsage();

    // Don't show while loading subscription status or for premium users
    if (isSubscriptionLoading || isPremium) {
        return null;
    }

    const getProgressColor = () => {
        if (isAtLimit) return "bg-red-500";
        if (isNearLimit) return "bg-yellow-500";
        return "bg-blue-500";
    };

    const handleUpgrade = (source: 'header' | 'soft_warning' | 'hard_warning') => {
        trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.UPGRADE_CLICKED_FROM_WARNING, {
            source,
            workflowCount,
            remainingWorkflows,
        });
        authClient.checkout({ slug: "pro" });
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-300">
            {/* Usage Counter - Compact */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Workflows: <span className="font-medium text-foreground">{workflowCount}</span> / {maxWorkflows}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpgrade('header')}
                    className="h-8"
                >
                    <Sparkles className="size-3 mr-1.5" />
                    Upgrade
                </Button>
            </div>

            {/* Progress Bar - Thinner */}
            <div className="relative">
                <Progress value={usagePercentage} className="h-1.5" />
                <div
                    className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${getProgressColor()}`}
                    style={{ width: `${usagePercentage}%` }}
                />
            </div>

            {/* Soft Limit Warning (8-9 workflows) - More Compact */}
            {isNearLimit && !isAtLimit && (
                <Alert variant="default" className="py-2.5 px-3 border-yellow-500/50 bg-yellow-500/10 flex-row items-center gap-2">
                    <AlertTriangle className="size-4 text-yellow-600 shrink-0" />
                    <AlertDescription className="text-sm block!">
                        You have <strong>{remainingWorkflows}</strong> workflow{remainingWorkflows !== 1 ? 's' : ''} remaining.{' '}
                        <button
                            onClick={() => handleUpgrade('soft_warning')}
                            className="text-yellow-700 hover:text-yellow-800 underline underline-offset-2 font-medium"
                        >
                            Upgrade for unlimited workflows
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Hard Limit Warning (10 workflows) - More Compact */}
            {isAtLimit && (
                <Alert variant="destructive" className="py-2.5 px-3 border-red-500/50 bg-red-500/10 flex-row items-center gap-2">
                    <AlertTriangle className="size-4 text-red-600 shrink-0" />
                    <AlertDescription className="text-sm block!">
                        You've reached your workflow limit.{' '}
                        <button
                            onClick={() => handleUpgrade('hard_warning')}
                            className="text-red-700 hover:text-red-800 underline underline-offset-2 font-medium"
                        >
                            Upgrade to create more
                        </button>
                    </AlertDescription>
                </Alert>
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
