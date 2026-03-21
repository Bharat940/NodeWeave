"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PublishDialogProps {
    workflowId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ workflowId, open, onOpenChange }: PublishDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("layout");

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const publishMutation = useMutation(
        trpc.template.publishFromWorkflow.mutationOptions({
            onSuccess: () => {
                toast.success("Workflow published as a Template!");
                queryClient.invalidateQueries(trpc.template.getFeatured.queryFilter());
                onOpenChange(false);
                // Reset state
                setName("");
                setDescription("");
                setIcon("layout");
            },
            onError: (error: any) => {
                toast.error(error.message || "Failed to publish template.");
            }
        })
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        publishMutation.mutate({ workflowId, name, description, icon } as any);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Publish Template</DialogTitle>
                        <DialogDescription>
                            Make this workflow available to all users. By publishing, its nodes and connections will be permanently saved as a public template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Stripe to Discord Notification"
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what this automation accomplishes..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="icon">Representative Icon</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select icon..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="layout">Layout (Default)</SelectItem>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="stripe">Stripe</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="clock">Clock/Cron</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={publishMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={publishMutation.isPending}>
                            {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Publish to Gallery
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
