"use client";

import React from "react";
import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseExecutions } from "../hooks/use-executions"
import { useExecutionsParams } from "../hooks/use-executions-params";
import { formatDistanceToNow } from "date-fns";
import type { Execution } from "@/generated/prisma/browser";
import { ExecutionStatus } from "@/generated/prisma/browser";
import { ExecutionFilters } from "./execution-filters";
import { ExecutionStatusIcon } from "./execution-status-icon";

import { useWorkflowExecutionsRealtime } from "../hooks/use-workflow-executions-realtime";
import { fetchWorkflowRealtimeToken } from "../actions";
import { useCallback } from "react";

export const ExecutionsList = () => {
    const [params] = useExecutionsParams();
    const executions = useSuspenseExecutions();

    const workflowId = params.workflowId || "";

    const refreshToken = useCallback(() => fetchWorkflowRealtimeToken(workflowId), [workflowId]);

    // Live sync for executions list
    useWorkflowExecutionsRealtime({
        workflowId,
        refreshToken,
    });

    return (
        <EntityList
            items={executions.data.items}
            getKey={(execution) => execution.id}
            renderItem={(execution) => <ExecutionItem data={execution} />}
            emptyView={<ExecutionsEmpty />}
        />
    )
};

export const ExecutionsHeader = () => {
    return (
        <EntityHeader
            title="Executions"
            description="View your workflow execution history"
        />
    );
};

export const ExecutionsPagination = () => {
    const executions = useSuspenseExecutions();
    const [params, setParams] = useExecutionsParams();

    return (
        <EntityPagination
            disabled={executions.isFetching}
            totalPages={executions.data.totalPages}
            page={executions.data.page}
            onPageChange={(page) => setParams({ ...params, page })}
        />
    )
}

export const ExecutionssContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<ExecutionsHeader />}
            search={<ExecutionFilters />}
            pagination={<ExecutionsPagination />}
        >
            {children}
        </EntityContainer>
    )
}

export const ExecutionsLoading = () => {
    return <LoadingView message="Loading Execution..." />
};

export const ExecutionsError = () => {
    return <ErrorView message="Error loading Execution..." />
}

export const ExecutionsEmpty = () => {
    return (
        <EmptyView
            message="You haven't created any executions yet. Get started by running your first workflow"
        />
    )
};



const formatStatus = (status: ExecutionStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionItem = ({
    data
}: {
    data: Execution & {
        workflow: {
            id: string;
            name: string;
        };
    };
}) => {
    const duration = data.completedAt
        ? Math.round(
            (new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) / 1000,
        ) : null;

    const subtitle = (
        <>
            {data.workflow.name} &bull; Started{" "}
            {formatDistanceToNow(data.startedAt, { addSuffix: true })}
            {duration !== null && <> &bull; Took {duration}s </>}
        </>
    )

    return (
        <EntityItem
            href={`/executions/${data.id}`}
            title={formatStatus(data.status)}
            subtitle={subtitle}
            image={
                <div className="size-8 flex items-center justify-center">
                    <ExecutionStatusIcon status={data.status} size={5} />
                </div>
            }
        />
    );
}