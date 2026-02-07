import { WORKFLOW_LIMITS } from "@/config/constants";
import { useEffect, useRef } from "react";
import { trackWorkflowLimitEvent, WORKFLOW_LIMIT_EVENTS } from "@/lib/analytics";
import { useHasActiveSubscription } from "@/app/features/subscriptions/hooks/use-subscription";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useWorkflowParams } from "./use-workflows-params";

export const useWorkflowUsage = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams();

    // Use regular query instead of suspense to handle errors gracefully
    const { data: workflows } = useQuery({
        ...trpc.workflows.getMany.queryOptions(params),
        retry: false, // Don't retry on auth errors
    });

    const { hasActiveSubscription: isPremium, isLoading: isSubscriptionLoading } = useHasActiveSubscription();

    const workflowCount = workflows?.totalCount || 0;
    const maxWorkflows = isPremium ? Infinity : WORKFLOW_LIMITS.FREE_USER_MAX_WORKFLOWS;
    const remainingWorkflows = isPremium ? Infinity : Math.max(0, WORKFLOW_LIMITS.FREE_USER_MAX_WORKFLOWS - workflowCount);
    const usagePercentage = isPremium ? 0 : Math.min(100, (workflowCount / WORKFLOW_LIMITS.FREE_USER_MAX_WORKFLOWS) * 100);
    const isNearLimit = !isPremium && workflowCount >= WORKFLOW_LIMITS.SOFT_LIMIT_WARNING_THRESHOLD;
    const isAtLimit = !isPremium && workflowCount >= WORKFLOW_LIMITS.FREE_USER_MAX_WORKFLOWS;

    // Track analytics when limits are reached
    const hasTrackedSoftLimit = useRef(false);
    const hasTrackedHardLimit = useRef(false);

    useEffect(() => {
        if (isNearLimit && !hasTrackedSoftLimit.current && !isPremium) {
            trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.SOFT_LIMIT_REACHED, {
                workflowCount,
                remainingWorkflows,
            });
            hasTrackedSoftLimit.current = true;
        }
    }, [isNearLimit, workflowCount, remainingWorkflows, isPremium]);

    useEffect(() => {
        if (isAtLimit && !hasTrackedHardLimit.current && !isPremium) {
            trackWorkflowLimitEvent(WORKFLOW_LIMIT_EVENTS.HARD_LIMIT_REACHED, {
                workflowCount,
            });
            hasTrackedHardLimit.current = true;
        }
    }, [isAtLimit, workflowCount, isPremium]);

    return {
        workflowCount,
        maxWorkflows,
        remainingWorkflows,
        usagePercentage,
        isNearLimit,
        isAtLimit,
        isPremium,
        isSubscriptionLoading,
    };
};
