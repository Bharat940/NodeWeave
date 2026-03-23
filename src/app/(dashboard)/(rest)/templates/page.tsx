import { requireAuth } from "@/lib/auth-utils";
import { prefetchTemplates } from "@/app/features/templates/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { TemplateList, TemplatesContainer } from "@/app/features/templates/components/templates-gallery";
import type { SearchParams } from "nuqs/server";
import { templatesParamsLoader } from "@/app/features/templates/server/params-loader";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Templates | Gallery",
    description: "Browse and deploy pre-built automation templates to accelerate your NodeWeave workflows.",
};

type Props = {
    searchParams: Promise<SearchParams>
};

const Page = async ({ searchParams }: Props) => {
    await requireAuth();

    const params = await templatesParamsLoader(searchParams);

    try {
        await prefetchTemplates(params);
    } catch {
        // Silent fail - client will refetch
    }

    return (
        <TemplatesContainer>
            <HydrateClient>
                <TemplateList />
            </HydrateClient>
        </TemplatesContainer>
    )
};

export default Page;
