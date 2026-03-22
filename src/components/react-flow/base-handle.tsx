import type { ComponentProps } from "react";
import { Handle, type HandleProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = HandleProps;

export function BaseHandle({
  className,
  children,
  ...props
}: ComponentProps<typeof Handle>) {
  return (
    <Handle
      {...props}
      className={cn(
        "size-2.5 rounded-full border-2 border-background bg-primary transition-all duration-300 hover:scale-125 hover:ring-2 hover:ring-primary/20",
        className,
      )}
    >
      {children}
    </Handle>
  );
}
