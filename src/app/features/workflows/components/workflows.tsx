"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/entity-components";
import { useCreateWorkflow, useRemoveWorkflow, useSuspenseWorkflows, useWorkflows } from "../hooks/use-workflows"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { formatDistanceToNow } from "date-fns";
import type { Workflow } from "@/generated/prisma";
import { WorkflowIcon } from "lucide-react";
import { WorkflowUsageDisplay } from "./workflow-usage-display";

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
        <EntitySearch value={searchValue} onChange={onSearchChange} placeholder="Seacrh Workflows..." />
    )
}

export const WorkflowList = () => {
    const { data: workflows, isLoading, isError } = useWorkflows();

    if (isLoading) {
        return <WorkflowsLoading />;
    }

    if (isError || !workflows) {
        return <WorkflowsError />;
    }

    return (
        <EntityList
            items={workflows.items}
            getKey={(workflow) => workflow.id}
            renderItem={(workflow) => <WorkFlowItem data={workflow} />}
            emptyView={<WorkFlowsEmpty />}
        />
    )
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
    const createWorkflow = useCreateWorkflow();
    const router = useRouter()
    const { handleError, modal } = useUpgradeModal();

    const handleCreate = () => {
        createWorkflow.mutate(undefined, {
            onSuccess: (data) => {
                router.push(`/workflows/${data.id}`)
            },
            onError: (error) => {
                handleError(error);
            },
        });
    }

    return (
        <>
            {modal}
            <EntityHeader
                title="Workflows"
                description="Create and manage your workflows"
                onNew={handleCreate}
                newButtonLabel="New workflow"
                disabeled={disabled}
                isCreating={createWorkflow.isPending}
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
    const router = useRouter()
    const createWorkflow = useCreateWorkflow();
    const { handleError, modal } = useUpgradeModal();

    const handleCreate = () => {
        createWorkflow.mutate(undefined, {
            onError: (error) => {
                handleError(error);
            },
            onSuccess: (data) => {
                router.push(`/workflows/${data.id}`)
            }
        });
    };

    return (
        <>
            {modal}
            <EmptyView
                onNew={handleCreate}
                message="You haven't created any workflows yet. Get started by creating your first  workflow"
            />
        </>
    )
}

export const WorkFlowItem = ({ data }: { data: Workflow }) => {

    const removeWorkflow = useRemoveWorkflow();

    const handleRemove = () => {
        removeWorkflow.mutate({ id: data.id })
    }

    return (
        <EntityItem
            href={`/workflows/${data.id}`}
            title={data.name}
            subtitle={
                <>
                    Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
                    &bull; Created{" "}
                    {formatDistanceToNow(data.createdAt, { addSuffix: true })}
                </>
            }
            image={
                <div className="size-8 flex items-center justify-center">
                    <WorkflowIcon className="size-5 text-muted-foreground" />
                </div>
            }
            onRemove={handleRemove}
            isRemoving={removeWorkflow.isPending}
        />
    );
}