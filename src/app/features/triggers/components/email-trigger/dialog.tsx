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

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const EmailTriggerDialog = ({
    open,
    onOpenChange
}: Props) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${baseUrl}/api/webhooks/email?workflowId=${workflowId}`;

    const curlCmd = `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d "{\\"from\\":\\"user@example.com\\",\\"to\\":\\"support@myapp.com\\",\\"subject\\":\\"Need help with my order\\",\\"body\\":\\"Hi, I placed an order #12345 but haven't received a confirmation email. Can you help?\\"}"`;

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
                        Email Trigger Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Starts your workflow when an email is received. Supports Resend, SendGrid, Mailgun, Postmark, or any custom webhook.
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
                        <p className="text-xs text-muted-foreground">
                            Point your email provider&apos;s inbound webhook to this URL
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="size-4" />
                            <h4 className="font-medium text-sm">Quick Test with cURL</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            No email provider needed — simulate an inbound email directly:
                        </p>
                        <div className="flex gap-2 items-start">
                            <code className="bg-background px-2 py-1 rounded border text-xs flex-1 whitespace-pre-wrap break-all">
                                {curlCmd}
                            </code>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 mt-1"
                                onClick={() => copyToClipboard(curlCmd)}
                            >
                                <CopyIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">Supported Providers</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li><strong>Resend</strong> — Subscribe to <code className="bg-background px-1 py-0.5 rounded">email.received</code> event</li>
                            <li><strong>SendGrid</strong> — Use Inbound Parse webhook</li>
                            <li><strong>Mailgun</strong> — Set up Routes → forward to this URL</li>
                            <li><strong>Postmark</strong> — Configure Inbound webhook URL</li>
                            <li><strong>Any provider</strong> — POST JSON with <code className="bg-background px-1 py-0.5 rounded">from</code>, <code className="bg-background px-1 py-0.5 rounded">subject</code>, <code className="bg-background px-1 py-0.5 rounded">body</code> fields</li>
                        </ul>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">Available Variables</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.from}}"}</code> — Sender
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.to}}"}</code> — Recipient
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.subject}}"}</code> — Subject
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.body}}"}</code> — Plain text
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.html}}"}</code> — HTML body
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.cc}}"}</code> — CC addresses
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.replyTo}}"}</code> — Reply-To
                            </div>
                            <div>
                                <code className="bg-background px-1 py-0.5 rounded">{"{{email.provider}}"}</code> — Provider name
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

