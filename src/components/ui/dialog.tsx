"use client";

import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered modal: focus-trapped, Esc to close, labelled by its title. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]" />
        <RD.Content
          className={cn(
            "bg-card data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border shadow-2xl duration-200",
            className,
          )}
        >
          <div className="flex items-start gap-3 border-b px-6 py-4">
            <div className="min-w-0 flex-1">
              <RD.Title className="text-lg font-semibold tracking-tight">
                {title}
              </RD.Title>
              {description ? (
                <RD.Description className="text-muted-foreground mt-1 text-sm">
                  {description}
                </RD.Description>
              ) : (
                <RD.Description className="sr-only">{title}</RD.Description>
              )}
            </div>
            <RD.Close
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring -mr-2 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </RD.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Shared select styling so native selects match Input. */
export const selectClass =
  "border-input bg-card focus-visible:border-primary focus-visible:ring-primary/15 h-11 w-full cursor-pointer rounded-lg border px-3 text-base shadow-xs transition-[border-color,box-shadow] focus-visible:ring-4 focus-visible:outline-none sm:text-sm disabled:cursor-not-allowed disabled:opacity-60";
