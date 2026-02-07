// Analytics tracking for workflow limit events
// Currently logs to console in development only
// You can extend this later if needed
export const trackWorkflowLimitEvent = (eventName: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Workflow Limit Event]', eventName, properties);
    }
};

export const WORKFLOW_LIMIT_EVENTS = {
    SOFT_LIMIT_REACHED: 'workflow_soft_limit_reached',
    HARD_LIMIT_REACHED: 'workflow_hard_limit_reached',
    UPGRADE_CLICKED_FROM_WARNING: 'upgrade_clicked_from_warning',
    UPGRADE_CLICKED_FROM_MODAL: 'upgrade_clicked_from_modal',
    WORKFLOW_CREATED_NEAR_LIMIT: 'workflow_created_near_limit',
};
