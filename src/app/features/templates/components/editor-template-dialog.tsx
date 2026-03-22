"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { editorAtom } from "../../editor/store/atoms";
import { TemplateIcon } from "./template-icon";
import { Button } from "@/components/ui/button";

interface EditorTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export function EditorTemplateDialog({ open, onOpenChange }: EditorTemplateDialogProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const editor = useAtomValue(editorAtom);

    const { data: templatesRaw, isLoading } = useQuery({ ...trpc.template.getFeatured.queryOptions(), enabled: open });
    const templates = Array.isArray(templatesRaw) ? templatesRaw : [];

    const useMutationAction = useMutation(
        trpc.template.useTemplate.mutationOptions({
            onSuccess: (data: any) => {
                if (editor) {
                    const currentNodes = editor.getNodes();
                    if (currentNodes.length === 1 && currentNodes[0].type === "INITIAL") {
                        editor.setNodes(data.nodes);
                        editor.setEdges(data.edges);
                    } else {
                        // Intelligent positioning: find the bottom-most node and offset
                        const maxY = currentNodes.length > 0
                            ? Math.max(...currentNodes.map(n => n.position.y))
                            : 0;

                        const offsetNodes = data.nodes.map((node: any) => ({
                            ...node,
                            position: {
                                ...node.position,
                                y: node.position.y + maxY + 100
                            }
                        }));

                        editor.addNodes(offsetNodes);
                        editor.addEdges(data.edges);
                    }
                    toast.success("Template inserted into canvas!");
                    setTimeout(() => {
                        toast.info("Check and update credentials for the newly added nodes.", {
                            duration: 5000,
                        });
                    }, 1000);
                    onOpenChange(false);
                }
            },
            onError: (error: any) => {
                toast.error(error.message || "Failed to fetch template mapping.");
            }
        })
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b bg-muted/30 shrink-0">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">Apply a Template</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base mt-1 sm:mt-2 text-muted-foreground line-clamp-2 sm:line-clamp-none">
                        Insert a pre-configured scenario directly onto your current canvas. Note: Existing nodes will remain.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 sm:p-8 pb-10 sm:pb-12 bg-muted/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent snap-y snap-proximity scroll-smooth">

                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
                        ))
                    ) : (
                        templates?.map((template: any) => {

                            return (
                                <Card
                                    key={template.id}
                                    className={cn(
                                        "group h-[340px] grid grid-rows-[auto_1fr_auto] border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative bg-card snap-start",
                                        useMutationAction.isPending && "opacity-50 pointer-events-none"
                                    )}
                                    onClick={() => useMutationAction.mutate({ templateId: template.id } as any)}
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-muted/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Row 1: icon + title */}
                                    <div className="p-5 pb-0 relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="size-12 rounded-xl border bg-background shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                <TemplateIcon name={template.icon} className="text-foreground/70 group-hover:text-primary transition-colors" />
                                            </div>
                                            {useMutationAction.isPending && (useMutationAction.variables as any)?.templateId === template.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            ) : (
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                    <ArrowRight className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xl font-semibold leading-tight line-clamp-1" title={template.name}>
                                            {template.name}
                                        </p>
                                    </div>

                                    {/* Row 2: description */}
                                    <div className="px-5 relative z-10 overflow-hidden">
                                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                                            {template.description}
                                        </p>
                                    </div>

                                    {/* Row 3: footer */}
                                    <div className="px-5 pb-4 pt-0 relative z-10 flex flex-col gap-3 border-t border-border/50">
                                        <div className="flex items-center justify-between gap-3 pt-1">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="flex-1 h-8 px-2 text-[10px] font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    useMutationAction.mutate({ templateId: template.id } as any);
                                                }}
                                                disabled={useMutationAction.isPending}
                                            >
                                                Apply to Canvas
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-8 px-2 text-[10px] font-semibold flex items-center justify-center gap-1.5 hover:bg-muted/50 border-dashed"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link href={`/templates/${template.id}`} target="_blank">
                                                    Preview
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] text-muted-foreground font-medium bg-muted/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                {template.useCount.toLocaleString()} {template.useCount === 1 ? 'use' : 'uses'}
                                            </span>
                                            {template.authorName && (
                                                <span className="text-[10px] font-semibold text-primary/60 truncate ml-3">
                                                    by {template.authorName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t bg-muted/30 flex justify-center w-full shrink-0">
                    <Link
                        href="/templates"
                        onClick={() => onOpenChange(false)}
                        className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1.5"
                    >
                        Browse full template gallery <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
