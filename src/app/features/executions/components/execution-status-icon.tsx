import { ExecutionStatus } from "@/generated/prisma/browser";
import { CheckCircle2Icon, CircleDashedIcon, ClockIcon, LoaderCircle, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ExecutionStatusIcon = ({
    status,
    size = 4,
}: {
    status: ExecutionStatus;
    size?: 3 | 4 | 5;
}) => {
    const sizeClass = `w-${size} h-${size}`;

    let Icon = CircleDashedIcon;
    let colorClass = "text-muted-foreground";
    let animClass = "";

    switch (status) {
        case ExecutionStatus.SUCCESS:
            Icon = CheckCircle2Icon;
            colorClass = "text-green-600";
            break;
        case ExecutionStatus.FAILED:
            Icon = XCircleIcon;
            colorClass = "text-red-600";
            break;
        case ExecutionStatus.RUNNING:
            Icon = LoaderCircle;
            colorClass = "text-blue-600";
            animClass = "animate-spin";
            break;
        case ExecutionStatus.QUEUED:
            Icon = ClockIcon;
            colorClass = "text-muted-foreground";
            animClass = "animate-pulse";
            break;
    }

    return (
        // Fixed-size wrapper — this box NEVER changes size or position
        // regardless of which icon is inside it
        <span className={cn("inline-flex items-center justify-center shrink-0", sizeClass)}>
            <Icon className={cn(sizeClass, colorClass, animClass)} />
        </span>
    );
};
