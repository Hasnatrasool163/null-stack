import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export const Input = ({
  className,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(field, "h-10", className)} {...p} />
);
export const Textarea = ({
  className,
  ...p
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(field, "min-h-24", className)} {...p} />
);
export const Label = ({
  className,
  ...p
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium", className)} {...p} />
);
