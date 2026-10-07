import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
);
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-muted animate-pulse rounded-md", className)} />
);
export const Badge = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "bg-accent text-accent-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      className,
    )}
    {...p}
  />
);
