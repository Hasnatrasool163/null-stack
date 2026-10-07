"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  ListTodo,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon; show: boolean };

function items(role: Role): NavItem[] {
  return [
    {
      href: "/projects",
      label: role === "AGENT" ? "Projects" : "Dashboard",
      icon: FolderKanban,
      show: true,
    },
    { href: "/my-tasks", label: "My Tasks", icon: ListTodo, show: role === "AGENT" },
    { href: "/team", label: "Team", icon: Users, show: true },
    {
      href: "/admin/transcript",
      label: "Create from Transcript",
      icon: Sparkles,
      show: role === "ADMIN",
    },
  ].filter((i) => i.show);
}

export function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items(role).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
                "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "bg-primary absolute inset-y-2 left-0 w-1 origin-center rounded-r-full transition-transform duration-300 ease-soft",
                  active ? "scale-y-100" : "scale-y-0",
                )}
              />
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-indigo-300" : "text-sidebar-muted group-hover:text-indigo-300",
                )}
                aria-hidden
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
