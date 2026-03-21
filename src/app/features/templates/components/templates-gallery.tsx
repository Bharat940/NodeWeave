"use client";

import React, { Suspense } from "react";
import { EntityContainer, EntityHeader, EntityPagination, EntitySearch, LoadingView } from "@/components/entity-components";
import { useTemplates, useSuspenseTemplates, useDeleteTemplate } from "@/app/features/templates/hooks/use-templates";
import { useWorkflowParams } from "@/app/features/workflows/hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateIcon } from "./template-icon";
import { ArrowRight, LayoutTemplate, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const TemplatesSearch = () => {
    const [params, setParams] = useWorkflowParams();
    const { searchValue, onSearchChange } = useEntitySearch({
        params,
        setParams,
    });

    return (
        <EntitySearch value={searchValue} onChange={onSearchChange} placeholder="Search Templates..." />
    )
}

const TemplateListContent = () => {
    const { data: templatesRaw, isLoading } = useSuspenseTemplates() as any;
    const { data: session } = authClient.useSession();
    const templates = templatesRaw;
    const deleteMutation = useDeleteTemplate();
    const isAdmin = session?.user?.role === "admin";

    if (templates.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card border-dashed">
                <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold">No templates found</h3>
                <p className="text-muted-foreground mt-2 max-w-md">Try searching for something else or check back later for new community templates.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.items.map((template: any) => {

                return (
                    <Card
                        key={template.id}
                        className={cn("group flex flex-col h-full border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative bg-card",
                            deleteMutation.isPending && deleteMutation.variables?.id === template.id && "opacity-50 pointer-events-none"
                        )}
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-muted/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardHeader className="pb-1 relative z-10 w-full">
                            <div className="flex items-center justify-between w-full mb-4">
                                <div className="size-12 rounded-xl border bg-background shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                    <TemplateIcon name={template.icon} className="text-foreground/70 group-hover:text-primary transition-colors" />
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteMutation.mutate({ id: template.id });
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <CardTitle className="text-xl line-clamp-1" title={template.name}>{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 flex-1 flex flex-col w-full">
                            <CardDescription className="text-sm leading-relaxed line-clamp-3 mb-6 flex-1 text-muted-foreground">
                                {template.description}
                            </CardDescription>
                            <div className="flex flex-col gap-3 w-full mt-auto pt-2 border-t border-border/50">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 flex items-center justify-center h-9 text-xs text-muted-foreground font-semibold bg-muted px-4 rounded-lg whitespace-nowrap shadow-xs">
                                        {template.useCount.toLocaleString()} {template.useCount === 1 ? 'use' : 'uses'}
                                    </div>
                                    <Button asChild size="sm" variant="outline" className="flex-1 h-9 px-4 font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 pointer-events-auto">
                                        <Link href={`/templates/${template.id}`}>
                                            Preview <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                        </Link>
                                    </Button>
                                </div>
                                {template.authorName && (
                                    <div className="text-xs text-muted-foreground truncate font-medium pl-1 flex items-center gap-1.5 opacity-80" title={`by ${template.authorName}`}>
                                        <span className="shrink-0 h-px w-3 bg-muted-foreground/30" /> by {template.authorName}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
};

export const TemplateList = () => {
    return (
        <Suspense fallback={<TemplatesLoading />}>
            <TemplateListContent />
        </Suspense>
    )
}

export const TemplatesHeader = () => {
    return (
        <EntityHeader
            title="Template Gallery"
            description="Discover pre-built workflows to kickstart your next automation"
            hiddenNewButton={true}
        />
    );
};

export const TemplatesPagination = () => {
    const { data: templatesRaw, isFetching } = useTemplates() as any;
    const [params, setParams] = useWorkflowParams();

    const templates = templatesRaw;
    if (!templates) {
        return null;
    }

    return (
        <EntityPagination
            disabled={isFetching}
            totalPages={templates.totalPages}
            page={templates.page}
            onPageChange={(page) => setParams({ ...params, page })}
        />
    )
}

export const TemplatesContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<TemplatesHeader />}
            search={<TemplatesSearch />}
            pagination={<TemplatesPagination />}
        >
            <div className="space-y-4">
                {children}
            </div>
        </EntityContainer>
    )
}

export const TemplatesLoading = () => {
    return <LoadingView message="Loading Templates" />
};
