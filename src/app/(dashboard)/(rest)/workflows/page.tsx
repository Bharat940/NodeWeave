import { requireAuth } from "@/lib/auth-utils";
import { prefetchWorkflows } from "../../../features/workflows/server/prefetch";
import { HydrateClient } from "../../../../trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { WorkflowList, WorkflowsContainer, WorkflowsError, WorkflowsLoading } from "@/app/features/workflows/components/workflows";
import type { SearchParams } from "nuqs/server";
import { workflowsParamsLoader } from "@/app/features/workflows/server/params-loader";

type Props = {
    searchParams: Promise<SearchParams>
};

const Page = async ({ searchParams }: Props) => {
    await requireAuth();

    const params = await workflowsParamsLoader(searchParams);
    prefetchWorkflows(params);

    return (
        <WorkflowsContainer>
            <HydrateClient>
                <ErrorBoundary fallback={<WorkflowsError />}>
                    <Suspense fallback={<WorkflowsLoading />}>
                        <WorkflowList />
                    </Suspense>
                </ErrorBoundary>
            </HydrateClient>
        </WorkflowsContainer>
    )
};

export default Page;