"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLinks } from "@/components/nav-links";
import type { Role } from "@/lib/types";

/** Slide-in drawer for small screens. The footer (user + logout) is passed in from the server. */
export function MobileNav({
  role,
  brand,
  footer,
}: {
  role: Role;
  brand: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="hover:bg-accent focus-visible:ring-ring -ml-2 grid h-11 w-11 cursor-pointer place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className="bg-sidebar data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left fixed inset-y-0 left-0 z-50 flex w-[18rem] max-w-[85vw] flex-col border-r p-4 shadow-2xl duration-300">
          <div className="flex items-center justify-between pb-6">
            {brand}
            <Dialog.Close
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring grid h-11 w-11 cursor-pointer place-items-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Main pages of NullToPlan
          </Dialog.Description>
          <nav aria-label="Main" className="flex-1">
            <NavLinks role={role} onNavigate={() => setOpen(false)} />
          </nav>
          {footer}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
