"use client";

import { ExecutionStatus } from "@/generated/prisma/browser";
import { useExecutionsParams } from "../hooks/use-executions-params";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

// Radix Select forbids empty string values — use "all" as a sentinel for "no filter"
const STATUS_OPTIONS = [
    { label: "All statuses", value: "all" },
    { label: "Running", value: ExecutionStatus.RUNNING },
    { label: "Success", value: ExecutionStatus.SUCCESS },
    { label: "Failed", value: ExecutionStatus.FAILED },
] as const;


export const ExecutionFilters = () => {
    const [params, setParams] = useExecutionsParams();

    const hasFilters = Boolean(params.status || params.workflowId);

    const clearFilters = () => {
        setParams({ status: null, workflowId: null, page: 1 });
    };

    return (
        <div className="flex items-center gap-2 flex-wrap px-1 pb-2">
            {/* Status Filter */}
            <Select
                value={params.status ?? "all"}
                onValueChange={(value) =>
                    setParams({ status: value === "all" ? null : value, page: 1 })
                }
            >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={clearFilters}
                >
                    <XIcon className="size-3 mr-1" />
                    Clear filters
                </Button>
            )}
        </div>
    );
};
