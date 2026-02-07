"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const WhatsappTriggerDialog = ({
    open,
    onOpenChange
}: Props) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp?workflowId=${workflowId}`;

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard")
        } catch {
            toast.error("Failed to copy");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        WhatsApp Trigger Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure your WhatsApp provider to send messages to this workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">
                            Webhook URL
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="webhook-url"
                                value={webhookUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(webhookUrl)}
                            >
                                <CopyIcon className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="twilio" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="twilio">Twilio</TabsTrigger>
                            <TabsTrigger value="meta">Meta Business API</TabsTrigger>
                        </TabsList>

                        <TabsContent value="twilio" className="space-y-4 pt-2">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <h4 className="font-medium text-sm">Twilio Setup (Sandbox/Production):</h4>
                                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li>Go to <strong>Messaging</strong> → <strong>Try it out</strong> → <strong>Send a WhatsApp message</strong> (for Sandbox)</li>
                                    <li>Or go to <strong>Messaging</strong> → <strong>Senders</strong> → <strong>WhatsApp Senders</strong> (for Production)</li>
                                    <li>Check &quot;Sandbox Settings&quot; (or Sender Settings)</li>
                                    <li>Paste the Webhook URL in <strong>&quot;When a message comes in&quot;</strong></li>
                                    <li>Set method to <strong>POST</strong></li>
                                    <li>Save settings</li>
                                </ol>
                            </div>
                        </TabsContent>

                        <TabsContent value="meta" className="space-y-4 pt-2">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <h4 className="font-medium text-sm">Meta App Setup:</h4>
                                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li>Go to <strong>Meta App Dashboard</strong> → <strong>WhatsApp</strong> → <strong>Configuration</strong></li>
                                    <li>Click <strong>Edit</strong> next to Webhook</li>
                                    <li>Paste the Webhook URL in <strong>Callback URL</strong></li>
                                    <li>
                                        Copy/Paste this as <strong>Verify Token</strong>:
                                        <div className="flex gap-2 mt-1 mb-1 items-center">
                                            <code className="bg-background px-2 py-1 rounded border text-xs flex-1 truncate">
                                                {workflowId}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => copyToClipboard(workflowId)}
                                            >
                                                <CopyIcon className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </li>
                                    <li>Click <strong>Verify and Save</strong></li>
                                    <li>Click <strong>Manage</strong> (Webhook fields) → Subscribe to <strong>messages</strong></li>
                                </ol>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">Available variables</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.from}}"}
                                </code>
                                - Sender phone number
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.body}}"}
                                </code>
                                - Message text content
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.senderName}}"}
                                </code>
                                - Sender&apos;s profile name
                            </li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
