import { 
  ExecutionsError, 
  ExecutionsList, 
  ExecutionsLoading, 
  ExecutionssContainer 
} from "@/app/features/executions/components/executions";
import { executionsParamsLoader } from "@/app/features/executions/server/params-loader";
import { prefetchExecutions } from "@/app/features/executions/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Executions | Dashboard",
    description: "Monitor and debug your workflow execution history in NodeWeave.",
};

type Props = {
    searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
    await requireAuth();

    const params = await executionsParamsLoader(searchParams);
    prefetchExecutions(params);

    return (
        <ExecutionssContainer>
            <HydrateClient>
                <ErrorBoundary fallback={<ExecutionsError />}>
                    <Suspense fallback={<ExecutionsLoading />}>
                        <ExecutionsList />
                    </Suspense>
                </ErrorBoundary>
            </HydrateClient>
        </ExecutionssContainer>
    )
}
export default Page;