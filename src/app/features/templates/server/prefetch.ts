import { prefetch, trpc } from "@/trpc/server";

export const prefetchTemplates = async (params: any) => {
    try {
        await prefetch(trpc.template.getMany.queryOptions(params));
    } catch {}
};

export const prefetchTemplateById = (id: string) => {
    return prefetch(trpc.template.getById.queryOptions({ id }));
};
