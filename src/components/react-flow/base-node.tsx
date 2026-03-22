import type { ComponentProps, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { NodeStatus } from "./node-status-indicator";
import { CheckCircle2Icon, Loader2Icon, MoonIcon, XCircleIcon } from "lucide-react";

interface BaseNodeProp extends HTMLAttributes<HTMLDivElement> {
  status?: NodeStatus;
}

export function BaseNode({
  className,
  status,
  ...props
}: BaseNodeProp) {
  return (
    <div
      id="base-node"
      className={cn(
        "glass-card relative rounded-md border-border/50 text-card-foreground transition-all duration-300 hover:border-primary/50",
        "[.react-flow\\_\\_node.selected_&]:border-primary",
        className,
      )}
      tabIndex={0}
      {...props}
    >
      {props.children}
      {status === "error" && (
        <XCircleIcon className="absolute right-0.5 bottom-0.5 size-2 text-destructive stroke-3" />
      )}
      {status === "success" && (
        <CheckCircle2Icon className="absolute right-0.5 bottom-0.5 size-2 text-emerald-500 stroke-3" />
      )}
      {status === "loading" && (
        <Loader2Icon className="absolute -right-0.5 -bottom-0.5 size-2 text-blue-500 stroke-3 animate-spin" />
      )}
      {status === "sleeping" && (
        <MoonIcon className="absolute right-0.5 bottom-0.5 size-2.5 text-amber-500 fill-amber-500" />
      )}
    </div>
  );
}

/**
 * A container for a consistent header layout intended to be used inside the
 * `<BaseNode />` component.
 */
export function BaseNodeHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={cn(
        "mx-0 my-0 -mb-1 flex flex-row items-center justify-between gap-2 px-3 py-2",
        // Remove or modify these classes if you modify the padding in the
        // `<BaseNode />` component.
        className,
      )}
    />
  );
}

/**
 * The title text for the node. To maintain a native application feel, the title
 * text is not selectable.
 */
export function BaseNodeHeaderTitle({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="base-node-title"
      className={cn("user-select-none flex-1 font-semibold truncate", className)}
      {...props}
    />
  );
}

export function BaseNodeContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-content"
      className={cn("flex flex-col gap-y-2 p-3", className)}
      {...props}
    />
  );
}

export function BaseNodeFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-footer"
      className={cn(
        "flex flex-col items-center gap-y-2 border-t px-3 pt-2 pb-3",
        className,
      )}
      {...props}
    />
  );
}
