import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "bg-card text-card-foreground rounded-lg border shadow-sm",
      className,
    )}
    {...p}
  />
);
export const CardHeader = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-6", className)} {...p} />
);
export const CardTitle = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-lg leading-none font-semibold tracking-tight",
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
  <div className={cn("p-6 pt-0", className)} {...p} />
);
