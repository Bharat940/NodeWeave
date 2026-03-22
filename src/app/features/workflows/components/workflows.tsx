"use client";

import React, { Component, Suspense, useState, type ErrorInfo, type ReactNode } from "react";
import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/entity-components";
import { TemplateDialog } from "@/app/features/templates/components/template-dialog";
import { useRemoveWorkflow, useSuspenseWorkflows, useWorkflows, useUpdateWorkflowStatus } from "../hooks/use-workflows"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useWorkflowParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { formatDistanceToNow } from "date-fns";
import type { Workflow } from "@/generated/prisma/browser";
import { WorkflowUsageDisplay } from "./workflow-usage-display";
import { Switch } from "@/components/ui/switch";
import { Loader2, WorkflowIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Class-based error boundary to catch errors during SSR
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class WorkflowListErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('WorkflowList error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <WorkflowsError />;
        }
        return this.props.children;
    }
}

export const WorkflowsSearch = () => {
    const [params, setParams] = useWorkflowParams();
    const { searchValue, onSearchChange } = useEntitySearch({
        params,
        setParams,
    });

    return (
        <EntitySearch value={searchValue} onChange={onSearchChange} placeholder="Search Workflows..." />
    )
}

const WorkflowListContent = () => {
    const { data: workflows } = useSuspenseWorkflows();

    return (
        <EntityList
            items={workflows.items}
            getKey={(workflow) => workflow.id}
            renderItem={(workflow) => <WorkFlowItem data={workflow} />}
            emptyView={<WorkFlowsEmpty />}
        />
    )
};

export const WorkflowList = () => {
    return (
        <WorkflowListErrorBoundary>
            <Suspense fallback={<WorkflowsLoading />}>
                <WorkflowListContent />
            </Suspense>
        </WorkflowListErrorBoundary>
    )
}

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
    const { modal } = useUpgradeModal();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreate = () => {
        setIsDialogOpen(true);
    };

    return (
        <>
            {modal}
            <TemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            <EntityHeader
                title="Workflows"
                description="Create and manage your workflows"
                onNew={handleCreate}
                newButtonLabel="New workflow"
                disabeled={disabled}
            />
        </>
    );
};

export const WorkflowsPagination = () => {
    const { data: workflows, isFetching } = useWorkflows();
    const [params, setParams] = useWorkflowParams();

    if (!workflows) {
        return null;
    }

    return (
        <EntityPagination
            disabled={isFetching}
            totalPages={workflows.totalPages}
            page={workflows.page}
            onPageChange={(page) => setParams({ ...params, page })}
        />
    )
}

export const WorkflowsContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
            search={<WorkflowsSearch />}
            pagination={<WorkflowsPagination />}
        >
            <div className="space-y-4">
                <WorkflowUsageDisplay />
                {children}
            </div>
        </EntityContainer>
    )
}

export const WorkflowsLoading = () => {
    return <LoadingView message="Loading Workflows" />
};

export const WorkflowsError = () => {
    return <ErrorView message="Error loading Workflows" />
}

export const WorkFlowsEmpty = () => {
    const { modal } = useUpgradeModal();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreate = () => setIsDialogOpen(true);

    return (
        <>
            {modal}
            <TemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            <EmptyView
                onNew={handleCreate}
                message="You haven't created any workflows yet. Get started by creating your first  workflow"
            />
        </>
    )
}

export const WorkFlowItem = ({ data }: { data: Workflow }) => {

    const removeWorkflow = useRemoveWorkflow();
    const updateStatus = useUpdateWorkflowStatus();

    const handleRemove = () => {
        removeWorkflow.mutate({ id: data.id })
    }

    return (
        <EntityItem
            href={`/workflows/${data.id}`}
            title={data.name}
            subtitle={
                <span className="flex items-center gap-1.5 truncate">
                    <span>Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}</span>
                    <span className="hidden sm:inline">&bull; Created {formatDistanceToNow(data.createdAt, { addSuffix: true })}</span>
                </span>
            }
            image={
                <div className="size-8 flex items-center justify-center">
                    <WorkflowIcon className="size-5 text-muted-foreground" />
                </div>
            }
            actions={
                <div
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2"
                >
                    <span className={cn(
                        "text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:flex items-center gap-1 transition-opacity",
                        updateStatus.isPending && "opacity-70"
                    )}>
                        {updateStatus.isPending && <Loader2 className="size-2.5 animate-spin text-blue-500" />}
                        {data.isActive ? "Active" : "Draft"}
                    </span>
                    <Switch
                        checked={data.isActive}
                        onCheckedChange={(checked) => updateStatus.mutate({ id: data.id, isActive: checked })}
                        disabled={removeWorkflow.isPending}
                        className={cn("scale-85 sm:scale-100", updateStatus.isPending && "opacity-50 transition-opacity")}
                    />
                </div>
            }
            onRemove={handleRemove}
            isRemoving={removeWorkflow.isPending}
        />
    );
}