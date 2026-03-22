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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TemplateIcon } from "./template-icon";

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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Publish Template</DialogTitle>
                        <DialogDescription>
                            Make this workflow available to all users. By publishing, its nodes and connections will be permanently saved as a public template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-sm font-semibold">Template Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Stripe to Discord Notification"
                                required
                                minLength={3}
                                className="h-10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what this automation accomplishes..."
                                required
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="icon" className="text-sm font-semibold">Representative Icon</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger className="h-12 w-full">
                                    <SelectValue placeholder="Select icon..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectGroup>
                                        <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-4 pb-2 px-3">Triggers</SelectLabel>
                                        <SelectItem value="manual"><div className="flex items-center gap-3"><TemplateIcon name="manual" className="size-4" /> Manual Trigger</div></SelectItem>
                                        <SelectItem value="webhook"><div className="flex items-center gap-3"><TemplateIcon name="webhook" className="size-4" /> Webhook Trigger</div></SelectItem>
                                        <SelectItem value="cron"><div className="flex items-center gap-3"><TemplateIcon name="cron" className="size-4" /> Schedule (Cron)</div></SelectItem>
                                        <SelectItem value="google-form"><div className="flex items-center gap-3"><TemplateIcon name="google-form" className="size-4" /> Google Form</div></SelectItem>
                                        <SelectItem value="stripe"><div className="flex items-center gap-3"><TemplateIcon name="stripe" className="size-4" /> Stripe Payment</div></SelectItem>
                                        <SelectItem value="github"><div className="flex items-center gap-3"><TemplateIcon name="github" className="size-4" /> GitHub Event</div></SelectItem>
                                        <SelectItem value="email"><div className="flex items-center gap-3"><TemplateIcon name="email" className="size-4" /> Email Trigger</div></SelectItem>
                                        <SelectItem value="whatsapp"><div className="flex items-center gap-3"><TemplateIcon name="whatsapp" className="size-4" /> WhatsApp</div></SelectItem>
                                        <SelectItem value="telegram"><div className="flex items-center gap-3"><TemplateIcon name="telegram" className="size-4" /> Telegram</div></SelectItem>
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-4 pb-2 px-3">AI & Messaging</SelectLabel>
                                        <SelectItem value="gemini"><div className="flex items-center gap-3"><TemplateIcon name="gemini" className="size-4" /> Google Gemini</div></SelectItem>
                                        <SelectItem value="openai"><div className="flex items-center gap-3"><TemplateIcon name="openai" className="size-4" /> OpenAI</div></SelectItem>
                                        <SelectItem value="anthropic"><div className="flex items-center gap-3"><TemplateIcon name="anthropic" className="size-4" /> Anthropic Claude</div></SelectItem>
                                        <SelectItem value="discord"><div className="flex items-center gap-3"><TemplateIcon name="discord" className="size-4" /> Discord Bot</div></SelectItem>
                                        <SelectItem value="slack"><div className="flex items-center gap-3"><TemplateIcon name="slack" className="size-4" /> Slack Bot</div></SelectItem>
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-4 pb-2 px-3">Logic & Flow</SelectLabel>
                                        <SelectItem value="condition"><div className="flex items-center gap-3"><TemplateIcon name="condition" className="size-4" /> If/Else Condition</div></SelectItem>
                                        <SelectItem value="transformer"><div className="flex items-center gap-3"><TemplateIcon name="transformer" className="size-4" /> Data Transformer</div></SelectItem>
                                        <SelectItem value="code"><div className="flex items-center gap-3"><TemplateIcon name="code" className="size-4" /> JS Code Engine</div></SelectItem>
                                        <SelectItem value="delay"><div className="flex items-center gap-3"><TemplateIcon name="delay" className="size-4" /> Delay/Wait</div></SelectItem>
                                        <SelectItem value="http"><div className="flex items-center gap-3"><TemplateIcon name="http" className="size-4" /> HTTP Request</div></SelectItem>
                                        <SelectItem value="layout"><div className="flex items-center gap-3"><TemplateIcon name="layout" className="size-4" /> Template Layout</div></SelectItem>
                                    </SelectGroup>
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
