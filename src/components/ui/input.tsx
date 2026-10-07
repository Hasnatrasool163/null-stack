import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-base sm:text-sm shadow-xs transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 hover:border-muted-foreground/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/15";

export const Input = ({
  className,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(field, "h-11", className)} {...p} />
);
export const Textarea = ({
  className,
  ...p
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(field, "min-h-24 leading-relaxed", className)} {...p} />
);
export const Label = ({
  className,
  ...p
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium", className)} {...p} />
);
