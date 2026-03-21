import { requireAuth } from "@/lib/auth-utils";
import { prefetchTemplateById } from "@/app/features/templates/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { TemplateShowcase } from "@/app/features/templates/components/template-showcase";

export const maxDuration = 60;

type Props = {
    params: Promise<{
        templateId: string;
    }>;
};

const TemplateIdPage = async ({ params }: Props) => {
    await requireAuth();

    const resolvedParams = await params;
    
    try {
        await prefetchTemplateById(resolvedParams.templateId);
    } catch {
        // Will refetch on client or display 404
    }

    return (
        <HydrateClient>
            <div className="h-full flex flex-col items-center max-w-screen-2xl mx-auto w-full p-4 md:p-8">
                <TemplateShowcase templateId={resolvedParams.templateId} />
            </div>
        </HydrateClient>
    );
};

export default TemplateIdPage;
