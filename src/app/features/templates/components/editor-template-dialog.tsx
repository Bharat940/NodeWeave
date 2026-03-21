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
            <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
                <DialogHeader className="p-8 pb-6 border-b bg-muted/30">
                    <DialogTitle className="text-3xl font-bold tracking-tight">Apply a Template</DialogTitle>
                    <DialogDescription className="text-base mt-2 text-muted-foreground">
                        Insert a pre-configured scenario directly onto your current canvas. Note: Existing nodes will remain.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 bg-muted/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">

                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[220px] w-full rounded-xl" />
                        ))
                    ) : (
                        templates?.map((template: any) => {

                            return (
                                <Card
                                    key={template.id}
                                    className={cn("group flex flex-col h-full border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative bg-card",
                                        useMutationAction.isPending && "opacity-50 pointer-events-none"
                                    )}
                                    onClick={() => useMutationAction.mutate({ templateId: template.id } as any)}
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-muted/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-4 relative z-10 w-full">
                                        <div className="flex items-center justify-between w-full mb-4">
                                            <div className="size-12 rounded-xl border bg-background shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                <TemplateIcon name={template.icon} className="text-foreground/70 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex justify-end">
                                                {useMutationAction.isPending && (useMutationAction.variables as any)?.templateId === template.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                ) : (
                                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                        <ArrowRight className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1" title={template.name}>{template.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10 flex-1 flex flex-col w-full">
                                        <CardDescription className="text-sm leading-relaxed line-clamp-3 mb-6 flex-1 text-muted-foreground">
                                            {template.description}
                                        </CardDescription>
                                        <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-border/50">
                                            <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">
                                                {template.useCount.toLocaleString()} {template.useCount === 1 ? 'use' : 'uses'}
                                            </div>
                                            {template.authorName && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={`by ${template.authorName}`}>
                                                    by {template.authorName}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
                <div className="p-4 border-t bg-muted/30 flex justify-center w-full">
                    <Link
                        href="/templates"
                        onClick={() => onOpenChange(false)}
                        className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1"
                    >
                        Browse full template gallery <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
