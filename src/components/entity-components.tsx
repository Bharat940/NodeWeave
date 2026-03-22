import { AlertTriangleIcon, Loader2Icon, MoreVerticalIcon, PackageOpenIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import React from "react";
import { Input } from "./ui/input";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle
} from "./ui/empty"
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle
} from "./ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./ui/dropdown-menu"
import { cn } from "@/lib/utils";

type EntityHeaderProps = {
    title: string;
    description?: string;
    newButtonLabel?: string;
    disabeled?: boolean;
    isCreating?: boolean;
    hiddenNewButton?: boolean;
} & (
        | { onNew: () => void; newButtonHref?: never }
        | { newButtonHref: string; onNew?: never }
        | { onNew?: never; newButtonHref?: never }
    )

export const EntityHeader = ({
    title,
    description,
    onNew,
    newButtonHref,
    newButtonLabel,
    disabeled,
    isCreating,
    hiddenNewButton
}: EntityHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
                {description && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {!hiddenNewButton && (
                <>
                    {onNew && !newButtonHref && (
                        <Button disabled={isCreating || disabeled} size="sm" onClick={onNew}>
                            <PlusIcon className="size-4" />
                            {newButtonLabel}
                        </Button>
                    )}
                    {newButtonHref && !onNew && (
                        <Button size="sm" asChild>
                            <Link href={newButtonHref as any} prefetch>
                                <PlusIcon className="size-4" />
                                {newButtonLabel}
                            </Link>
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

type EntityContainerProps = {
    children: React.ReactNode;
    header?: React.ReactNode;
    search?: React.ReactNode;
    pagination?: React.ReactNode;
};

export const EntityContainer = ({
    children,
    header,
    pagination,
    search
}: EntityContainerProps) => {
    return (
        <div className="p-3 sm:p-6 md:p-8 lg:p-10 h-full">
            <div className="mx-auto max-w-7xl w-full flex flex-col gap-y-6 md:gap-y-8 h-full">
                {header}
                <div className="flex flex-col gap-y-4 h-full">
                    {search}
                    {children}
                </div>
                {pagination}
            </div>
        </div>
    )
};

interface EntitySearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export const EntitySearch = ({ value, onChange, placeholder = "Search" }: EntitySearchProps) => {
    return (
        <div className="relative w-full sm:max-w-[200px] sm:ml-auto">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-full bg-background shadow-none border-border pl-8 h-9 text-sm" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}

interface EntityPaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
};

export const EntityPagination = ({
    onPageChange,
    page,
    totalPages,
    disabled
}: EntityPaginationProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full border-t border-border/40 pt-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Page <span className="text-foreground font-medium">{page}</span> of <span className="text-foreground font-medium">{totalPages || 1}</span>
            </div>
            <div className="flex items-center justify-end space-x-2 order-1 sm:order-2">
                <Button disabled={page === 1 || disabled} variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))}>
                    Previous
                </Button>
                <Button disabled={page === totalPages || totalPages === 0 || disabled} variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
                    Next
                </Button>
            </div>
        </div>
    )
}

interface StateViewProps {
    message?: string;
};

export const LoadingView = ({ message }: StateViewProps) => {
    return (
        <div className="flex justify-center items-center h-full flex-1 flex-col gap-y-4">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            {!!message && (
                <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            )
            }
        </div>
    );
};

export const ErrorView = ({ message }: StateViewProps) => {
    return (
        <div className="flex justify-center items-center h-full flex-1 flex-col gap-y-4">
            <AlertTriangleIcon className="size-6 text-primary" />
            {!!message && (
                <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            )
            }
        </div>
    );
};

interface EmptyViewProps extends StateViewProps {
    onNew?: () => void
};

export const EmptyView = ({ message, onNew }: EmptyViewProps) => {
    return (
        <Empty className="border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <PackageOpenIcon />
                </EmptyMedia>
            </EmptyHeader>
            <EmptyTitle>
                No Items
            </EmptyTitle>
            {!!message && (
                <EmptyDescription>
                    {message}
                </EmptyDescription>
            )
            }
            {!!onNew && (
                <EmptyContent>
                    <Button onClick={onNew}>
                        Add item
                    </Button>
                </EmptyContent>
            )}
        </Empty>
    );
};

interface EntityListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    getKey?: (item: T, index: number) => string | number;
    emptyView?: React.ReactNode;
    className?: string
};

export function EntityList<T>({
    items,
    renderItem,
    className,
    emptyView,
    getKey
}: EntityListProps<T>) {
    if (items.length === 0 && emptyView) {
        return (
            <div className="flex flex-1 justify-center items-center">
                <div className="max-w-sm mx-auto">{emptyView}</div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-y-4", className)}>
            {items.map((item, index) => (
                <div key={getKey ? getKey(item, index) : index}>
                    {renderItem(item, index)}
                </div>
            ))}
        </div>
    )
}

interface EntityItemProps {
    href: string;
    title: string;
    actions?: React.ReactNode;
    image?: React.ReactNode;
    subtitle?: React.ReactNode;
    onRemove?: () => void | Promise<void>;
    isRemoving?: boolean;
    className?: string;
};

export const EntityItem = ({
    href,
    title,
    actions,
    className,
    image,
    isRemoving,
    onRemove,
    subtitle
}: EntityItemProps) => {

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRemoving) {
            return;
        }

        if (onRemove) {
            await onRemove()
        }
    }

    return (
        <Link href={href} prefetch>
            <Card className={cn(
                "p-4 shadow-none hover:shadow-md hover:bg-accent/50 transition-all cursor-pointer border-border/50 overflow-hidden",
                isRemoving && "opacity-50 cursor-not-allowed",
                className,
            )}>
                <CardContent className="flex flex-row items-center justify-between p-0 gap-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">{image}</div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-medium truncate">
                                {title}
                            </CardTitle>
                            {!!subtitle && (
                                <CardDescription className="text-xs truncate">
                                    {subtitle}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    {(actions || onRemove) && (
                        <div className="flex gap-x-3 items-center shrink-0 ml-auto">
                            {actions}
                            {onRemove && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                            <MoreVerticalIcon className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={handleRemove}>
                                            <TrashIcon className="size-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
};
