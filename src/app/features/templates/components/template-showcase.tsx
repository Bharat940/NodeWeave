"use client";

import React, { useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReactFlow, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeComponents } from "@/config/node-components";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, PlayCircle, Star, BarChart3, User, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate } from "date-fns";
import { WorkflowIcon, Settings2, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingView, ErrorView } from "@/components/entity-components";
import { authClient } from "@/lib/auth-client";
import { EditTemplateDialog } from "./edit-template-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { TemplateIcon } from "./template-icon";

export const TemplateShowcase = ({ templateId }: { templateId: string }) => {
    const trpc = useTRPC();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const isAdmin = session?.user?.role === "admin";

    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const { data: template, isLoading, isError } = useQuery({
        ...trpc.template.getById.queryOptions({ id: templateId })
    });

    const useMutationAction = useMutation(
        trpc.template.useTemplate.mutationOptions({
            onSuccess: (clonedData: any) => {
                createWorkflow.mutate({
                    templateId: template?.id, // Pass the id to the backend for naming context
                    nodes: clonedData.nodes,
                    edges: clonedData.edges
                });

            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to clone template");
            }
        })
    );

    // Provide the newly created workflow
    const createWorkflow = useMutation(
        trpc.workflows.create.mutationOptions({
            onSuccess: (data: any) => {
                toast.success("Workflow created from template!");
                router.push(`/workflows/${data.id}`);
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to construct new workflow");
            }
        })
    );

    const deleteMutation = useMutation(
        trpc.template.delete.mutationOptions({
            onSuccess: () => {
                toast.success("Template deleted successfully");
                router.push("/templates");
            },
            onError: (err) => {
                toast.error(err.message || "Failed to delete template");
            }
        })
    );

    const isPending = useMutationAction.isPending || createWorkflow.isPending;

    // React Flow initialization memory
    const nodes = useMemo(() => {
        if (!template?.nodes) return [] as Node[];
        const rawNodes = Array.isArray(template.nodes) ? template.nodes : [];
        return rawNodes.map((node: any) => ({
            id: node.id || node.originalId || Math.random().toString(36).substr(2, 9),
            type: node.type,
            position: node.position || { x: 0, y: 0 },
            data: node.data || {},
            ...node, // Maintain other props but ensure id/type/position/data take precedence if missing
        })) as Node[];
    }, [template?.nodes]);

    const edges = useMemo(() => {
        if (!template?.connections) return [] as Edge[];
        const rawEdges = Array.isArray(template.connections) ? template.connections : [];
        return rawEdges.map((edge: any, index: number) => ({
            ...edge,
            // Create a truly unique ID for edges to avoid React duplicate key warnings
            id: edge.id || `edge-${edge.fromNodeId}-${edge.toNodeId}-${index}`,
            source: edge.fromNodeId,
            target: edge.toNodeId,
            sourceHandle: edge.fromOutput || 'main',
            targetHandle: edge.toInput || 'main',
        })) as Edge[];
    }, [template?.connections]);

    if (isLoading) return <LoadingView message="Loading template details..." />;
    if (isError || !template) return <ErrorView message="Failed to find template" />;


    return (
        <div className="w-full flex justify-center h-full">
            <div className="flex flex-col lg:flex-row gap-8 w-full">
                {/* Left Side: Information Pane */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0 pt-4">
                    <Link href="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Gallery
                    </Link>

                    <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                        {template.isFeatured && (
                            <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3 fill-primary" /> Featured
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-muted to-muted/50 border flex items-center justify-center shadow-inner">
                                <TemplateIcon name={template.icon} className="size-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight mb-2">{template.name}</h1>

                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <Badge variant="secondary" className="font-normal text-xs py-0.5 gap-1.5">
                                        <BarChart3 className="w-3 h-3" /> {template.useCount.toLocaleString()} {template.useCount === 1 ? 'use' : 'uses'}
                                    </Badge>
                                    <Badge variant="outline" className="font-normal text-xs py-0.5 gap-1.5 border-dashed">
                                        <WorkflowIcon className="w-3 h-3" /> {nodes.length} actions
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {template.description}
                            </p>
                        </div>

                        <div className="mt-auto pt-6 border-t flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs text-muted-foreground w-full">
                                <div className="flex items-center gap-1.5" title="Author">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="font-medium">{template.authorName || 'Community'}</span>
                                </div>
                                <div className="flex items-center gap-1.5" title="Published">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDate(new Date(template.createdAt), "MMM d, yyyy")}</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full text-base gap-2 font-semibold shadow-md active:scale-[0.98] transition-all"
                                onClick={() => useMutationAction.mutate({ templateId: template.id })}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <PlayCircle className="w-5 h-5" />
                                )}
                                {isPending ? "Constructing Magic..." : "Use this Template"}
                            </Button>
                        </div>

                        {isAdmin && (
                            <div className="pt-6 border-t mt-2 flex flex-col gap-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Admin Controls</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="gap-2 text-sm border-dashed hover:border-primary hover:text-primary transition-all"
                                        onClick={() => setIsEditDialogOpen(true)}
                                    >
                                        <Settings2 className="w-4 h-4" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="gap-2 text-sm border-dashed hover:border-destructive hover:text-destructive transition-all"
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {template && (
                    <EditTemplateDialog
                        template={template}
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                    />
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the template
                                <span className="font-bold text-foreground"> "{template.name}"</span> and remove it from our gallery.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: template.id })}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:ring-destructive"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Right Side: Flow Visualization (Dead Editor) - Sticky on Desktop */}
                <div className="w-full lg:w-2/3 h-[500px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-8 bg-muted/20 border-2 border-dashed rounded-3xl overflow-hidden relative group shrink-0">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Interactive Preview</span>
                    </div>

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeComponents}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        proOptions={{ hideAttribution: true }}
                        // Crucial overrides for read-only view
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnDrag={true}
                        zoomOnScroll={true}
                        minZoom={0.5}
                        maxZoom={2}
                        className="bg-transparent"
                    >
                        <Background gap={20} size={1} color="#cbd5e1" className="opacity-50" />
                        <Controls className="fill-foreground bg-background border shadow-md" showInteractive={false} />
                    </ReactFlow>

                    {/* Faded bottom gradient trick */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background/50 to-transparent pointer-events-none z-10" />
                </div>
            </div>
        </div>
    );
};
