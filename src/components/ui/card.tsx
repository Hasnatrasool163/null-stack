import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "bg-card text-card-foreground shadow-card rounded-xl border",
      className,
    )}
    {...p}
  />
);
export const CardHeader = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...p} />
);
export const CardTitle = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-base leading-snug font-semibold tracking-tight",
      className,
    )}
    {...p}
  />
);
export const CardDescription = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...p} />
);
export const CardContent = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...p} />
);
