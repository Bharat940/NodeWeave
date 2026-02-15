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
import { CopyIcon, TerminalIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const WebhookTriggerDialog = ({
    open,
    onOpenChange
}: Props) => {
    const params = useParams();
    const workflowId = params?.workflowId as string;

    const [origin, setOrigin] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    const webhookUrl = workflowId && origin
        ? `${origin}/api/webhooks/generic?workflowId=${workflowId}`
        : "Save workflow to generate URL";

    const curlCmd = `curl -X POST "${webhookUrl}" \\
-H "Content-Type: application/json" \\
-d '{"key": "value"}'`;

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
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Webhook Trigger Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Trigger this workflow via an HTTP POST request.
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
                                disabled={!workflowId}
                            >
                                <CopyIcon className="size-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Send a POST request to this URL to trigger the workflow.
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="size-4" />
                            <h4 className="font-medium text-sm">Example cURL</h4>
                        </div>
                        <div className="flex gap-2 items-start">
                            <code className="bg-background px-2 py-1 rounded border text-xs flex-1 whitespace-pre-wrap break-all">
                                {curlCmd}
                            </code>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 mt-1"
                                onClick={() => copyToClipboard(curlCmd)}
                                disabled={!workflowId}
                            >
                                <CopyIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">Payload Access</h4>
                        <p className="text-xs text-muted-foreground">
                            The JSON body of the request is available in the workflow under the <code>webhook</code> variable.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Example: <code>{"{{webhook.key}}"}</code>
                        </p>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};
