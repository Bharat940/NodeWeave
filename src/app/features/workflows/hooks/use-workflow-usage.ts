import { WORKFLOW_LIMITS } from "@/config/constants";
import { useEffect, useRef } from "react";
import { trackWorkflowLimitEvent, WORKFLOW_LIMIT_EVENTS } from "@/lib/analytics";
import { useHasActiveSubscription } from "@/app/features/subscriptions/hooks/use-subscription";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useWorkflowParams } from "./use-workflows-params";

export const useWorkflowUsage = () => {
    const trpc = useTRPC();

    const { data: usageData } = useQuery({
        ...trpc.workflows.getUsage.queryOptions(),
        retry: false,
        refetchInterval: 10000, // Poll every 10 seconds to catch background webhook triggers
    });

    const { hasActiveSubscription: isPremium, isLoading: isSubscriptionLoading } = useHasActiveSubscription();

    const workflowCount = usageData?.totalWorkflowsCount || 0;
    const activeWorkflowsCount = usageData?.activeWorkflowsCount || 0;
    const executionsCount = usageData?.executionsCount || 0;

    const maxWorkflows = isPremium ? Infinity : WORKFLOW_LIMITS.FREE_USER_MAX_WORKFLOWS;
    const maxActiveWorkflows = isPremium ? Infinity : WORKFLOW_LIMITS.MAX_ACTIVE_WORKFLOWS_FREE;
    const maxExecutions = isPremium ? Infinity : WORKFLOW_LIMITS.FREE_USER_MAX_EXECUTIONS;

    const remainingWorkflows = isPremium ? Infinity : Math.max(0, maxWorkflows - workflowCount);
    
    const workflowUsagePercentage = isPremium ? 0 : Math.min(100, (workflowCount / maxWorkflows) * 100);
    const executionUsagePercentage = isPremium ? 0 : Math.min(100, (executionsCount / maxExecutions) * 100);

    const isNearWorkflowLimit = !isPremium && workflowCount >= WORKFLOW_LIMITS.SOFT_LIMIT_WARNING_THRESHOLD;
    const isAtWorkflowLimit = !isPremium && workflowCount >= maxWorkflows;
    
    const isNearExecutionLimit = !isPremium && executionsCount >= (maxExecutions * 0.8);
    const isAtExecutionLimit = !isPremium && executionsCount >= maxExecutions;

    // Track analytics when limits are reached
    const hasTrackedSoftLimit = useRef(false);
    const hasTrackedHardLimit = useRef(false);

    useEffect(() => {
        if (isNearWorkflowLimit && !hasTrackedSoftLimit.current && !isPremium) {
            trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.SOFT_LIMIT_REACHED, {
                workflowCount,
                remainingWorkflows,
            });
            hasTrackedSoftLimit.current = true;
        }
    }, [isNearWorkflowLimit, workflowCount, remainingWorkflows, isPremium]);

    useEffect(() => {
        if (isAtWorkflowLimit && !hasTrackedHardLimit.current && !isPremium) {
            trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.HARD_LIMIT_REACHED, {
                workflowCount,
            });
            hasTrackedHardLimit.current = true;
        }
    }, [isAtWorkflowLimit, workflowCount, isPremium]);

    return {
        workflowCount,
        maxWorkflows,
        activeWorkflowsCount,
        maxActiveWorkflows,
        executionsCount,
        maxExecutions,
        remainingWorkflows,
        workflowUsagePercentage,
        executionUsagePercentage,
        isNearWorkflowLimit,
        isAtWorkflowLimit,
        isNearExecutionLimit,
        isAtExecutionLimit,
        isPremium,
        isSubscriptionLoading,
    };
};
