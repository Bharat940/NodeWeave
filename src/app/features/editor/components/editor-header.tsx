"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Loader2, SaveIcon, ShareIcon, LayoutTemplate } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { PublishDialog } from "@/app/features/templates/components/publish-dialog";
import { EditorTemplateDialog } from "@/app/features/templates/components/editor-template-dialog";
import { authClient } from "@/lib/auth-client";
import { useSuspenseWorkflow, useUpdateWorkflow, useUpdateWorkflowName, useUpdateWorkflowStatus } from "@/app/features/workflows/hooks/use-workflows";
import { Input } from "@/components/ui/input";
import { useAtomValue } from "jotai";
import { editorAtom } from "../store/atoms";
import { ExecutionHistoryButton } from "./execution-history";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const EditorActiveToggle = ({ workflowId }: { workflowId: string }) => {
    const { data: workflow } = useSuspenseWorkflow(workflowId);
    const updateStatus = useUpdateWorkflowStatus();

    return (
        <div className="flex items-center gap-2 mr-2">
            <span className={cn(
                "text-sm text-muted-foreground font-medium flex items-center gap-1.5 transition-opacity",
                updateStatus.isPending && "opacity-70"
            )}>
                {updateStatus.isPending && <Loader2 className="size-3.5 animate-spin text-blue-500" />}
                {workflow.isActive ? "Active" : "Draft"}
            </span>
            <Switch
                checked={workflow.isActive}
                onCheckedChange={(checked) => updateStatus.mutate({ id: workflowId, isActive: checked })}
                className={cn(updateStatus.isPending && "opacity-50 transition-opacity")}
            />
        </div>
    );
};

export const EditorSaveButton = ({ workflowId }: { workflowId: string }) => {
    const editor = useAtomValue(editorAtom);
    const saveWorkflow = useUpdateWorkflow();

    const handleSave = () => {
        if (!editor) {
            return;
        }

        const nodes = editor.getNodes();
        const edges = editor.getEdges();

        saveWorkflow.mutate({
            id: workflowId,
            nodes,
            edges
        });
    }

    return (
        <div className="ml-auto">
            <Button size="sm" onClick={handleSave} disabled={saveWorkflow.isPending}>
                <SaveIcon className="size-4" />
                Save
            </Button>
        </div>
    )
};

export const EditorNameInput = ({ workflowId }: { workflowId: string }) => {
    const { data: workflow } = useSuspenseWorkflow(workflowId);
    const updateWorkflow = useUpdateWorkflowName();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(workflow.name);

    const inputRef = useRef<HTMLInputElement>(null);;

    useEffect(() => {
        if (workflow.name) {
            setName(workflow.name)
        }
    }, [workflow.name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (name === workflow.name) {
            setIsEditing(false);
            return;
        }

        try {
            await updateWorkflow.mutateAsync({
                id: workflowId,
                name,
            });
        } catch {
            setName(workflow.name);
        } finally {
            setIsEditing(false);
        };
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setName(workflow.name);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Input
                disabled={updateWorkflow.isPending}
                ref={inputRef}
                value={name}
                onChange={(e) =>
                    setName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-7 w-auto min-w-[100px] px-2"
            />
        );
    }

    return (
        <BreadcrumbItem onClick={() => setIsEditing(true)} className="cursor-pointer hover:text-foreground transition-colors">
            {workflow.name}
        </BreadcrumbItem>
    )
};

export const EditorBreadCrumbs = ({ workflowId }: { workflowId: string }) => {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link prefetch href="/workflows">
                            Workflows
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <EditorNameInput workflowId={workflowId} />
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export const EditorPublishButton = ({ workflowId }: { workflowId: string }) => {
    const { data: session } = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);

    if (session?.user?.role !== "admin") {
        return null;
    }

    return (
        <>
            <PublishDialog workflowId={workflowId} open={isOpen} onOpenChange={setIsOpen} />
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <ShareIcon className="size-4 mr-2" />
                <span className="hidden sm:inline">Publish Template</span>
            </Button>
        </>
    );
};

export const EditorApplyTemplateButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <EditorTemplateDialog open={isOpen} onOpenChange={setIsOpen} />
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <LayoutTemplate className="size-4 mr-2" />
                <span className="hidden sm:inline">Apply Template</span>
            </Button>
        </>
    );
};

export const EditorHeader = ({ workflowId }: { workflowId: string }) => {
    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
            <SidebarTrigger />
            <EditorBreadCrumbs workflowId={workflowId} />
            <div className="ml-auto flex items-center gap-2">
                <EditorApplyTemplateButton />
                <EditorPublishButton workflowId={workflowId} />
                <EditorActiveToggle workflowId={workflowId} />
                <ExecutionHistoryButton workflowId={workflowId} />
                <EditorSaveButton workflowId={workflowId} />
            </div>
        </header>
    )
}