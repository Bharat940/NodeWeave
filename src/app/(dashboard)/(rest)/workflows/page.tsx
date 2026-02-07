import { requireAuth } from "@/lib/auth-utils";
import { prefetchWorkflows } from "../../../features/workflows/server/prefetch";
import { HydrateClient } from "../../../../trpc/server";
import { WorkflowList, WorkflowsContainer } from "@/app/features/workflows/components/workflows";
import type { SearchParams } from "nuqs/server";
import { workflowsParamsLoader } from "@/app/features/workflows/server/params-loader";

type Props = {
    searchParams: Promise<SearchParams>
};

const Page = async ({ searchParams }: Props) => {
    await requireAuth();

    const params = await workflowsParamsLoader(searchParams);

    // Prefetch but don't fail if auth errors occur
    try {
        await prefetchWorkflows(params);
    } catch {
        // Silent fail - client will refetch
    }

    return (
        <WorkflowsContainer>
            <HydrateClient>
                <WorkflowList />
            </HydrateClient>
        </WorkflowsContainer>
    )
};

export default Page;