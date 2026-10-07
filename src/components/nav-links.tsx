"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  KanbanSquare,
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
    {
      href: "/my-tasks",
      label: "My Tasks",
      icon: ListTodo,
      show: role === "AGENT",
    },
    { href: "/board", label: "Board", icon: KanbanSquare, show: true },
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
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-sidebar-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "bg-primary ease-soft absolute inset-y-2.5 left-0 w-[3px] origin-center rounded-r-full transition-transform duration-300",
                  active ? "scale-y-100" : "scale-y-0",
                )}
              />
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-muted group-hover:text-primary",
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
