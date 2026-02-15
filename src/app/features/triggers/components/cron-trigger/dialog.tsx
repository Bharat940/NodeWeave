"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReactFlow } from "@xyflow/react";
import { ClockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CronExpressionParser } from "cron-parser";

interface CronTriggerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCron?: string;
    nodeId: string;
}

export function CronTriggerDialog({
    open,
    onOpenChange,
    initialCron,
    nodeId,
}: CronTriggerDialogProps) {
    const { setNodes } = useReactFlow();
    const [cronExpression, setCronExpression] = useState(initialCron || "* * * * *");

    const handleSave = () => {
        try {
            CronExpressionParser.parse(cronExpression);

            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                cron: cronExpression,
                            },
                        };
                    }
                    return node;
                })
            );

            toast.success("Schedule saved");
            onOpenChange(false);
        } catch (err) {
            toast.error("Invalid cron expression");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClockIcon className="size-5" />
                        Schedule Trigger
                    </DialogTitle>
                    <DialogDescription>
                        Set a cron expression to schedule this workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cron">Cron Expression</Label>
                        <Input
                            id="cron"
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            placeholder="* * * * *"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter a cron expression to schedule your workflow execution.
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <h4 className="font-medium text-sm">Quick Presets</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-auto py-2 px-3"
                                onClick={() => setCronExpression("* * * * *")}
                            >
                                <span className="font-mono mr-2">* * * * *</span>
                                <span className="text-muted-foreground">Every minute</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-auto py-2 px-3"
                                onClick={() => setCronExpression("0 * * * *")}
                            >
                                <span className="font-mono mr-2">0 * * * *</span>
                                <span className="text-muted-foreground">Hourly</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-auto py-2 px-3"
                                onClick={() => setCronExpression("0 9 * * *")}
                            >
                                <span className="font-mono mr-2">0 9 * * *</span>
                                <span className="text-muted-foreground">Daily at 9 AM</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-auto py-2 px-3"
                                onClick={() => setCronExpression("0 0 * * 1")}
                            >
                                <span className="font-mono mr-2">0 0 * * 1</span>
                                <span className="text-muted-foreground">Weekly on Monday</span>
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">Format Reference</h4>
                        <div className="bg-background p-3 rounded border font-mono text-xs text-muted-foreground">
                            <div className="grid grid-cols-[110px_1fr] gap-x-3 leading-tight">

                                <div>* * * * *</div>
                                <div></div>

                                <div>| | | | |</div>
                                <div></div>

                                <div>| | | | +--</div>
                                <div>Day of Week (0-7) (Sun=0 or 7)</div>

                                <div>| | | +----</div>
                                <div>Month (1-12)</div>

                                <div>| | +------</div>
                                <div>Day of Month (1-31)</div>

                                <div>| +--------</div>
                                <div>Hour (0-23)</div>

                                <div>+----------</div>
                                <div>Minute (0-59)</div>

                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}