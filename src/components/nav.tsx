import Link from "next/link";
import { LogOut } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { Avatar } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/types";

export const ROLE_LABEL = { ADMIN: "Admin", MANAGER: "Manager", AGENT: "Developer" };

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className="focus-visible:ring-primary inline-flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
        N
      </span>
      <span
        className={
          dark
            ? "text-base font-semibold tracking-tight text-white"
            : "text-base font-semibold tracking-tight"
        }
      >
        NovaWorks
      </span>
    </Link>
  );
}

function UserFooter({ user }: { user: SessionUser }) {
  return (
    <div className="border-sidebar-accent mt-4 flex items-center gap-3 border-t pt-4">
      <Avatar name={user.name} className="ring-sidebar" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="text-sidebar-muted text-xs">{ROLE_LABEL[user.role]}</p>
      </div>
      <form method="post" action="/api/auth/logout">
        <button
          type="submit"
          className="text-sidebar-muted hover:bg-sidebar-accent focus-visible:ring-primary grid h-10 w-10 cursor-pointer place-items-center rounded-lg transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/** Desktop: fixed dark sidebar. Mobile: sticky top bar with a drawer. */
export function Nav({ user }: { user: SessionUser }) {
  return (
    <>
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-4 lg:flex">
        <div className="px-1 pb-8">
          <Brand dark />
        </div>
        <p className="text-sidebar-muted px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
          Workspace
        </p>
        <nav aria-label="Main" className="flex-1">
          <NavLinks role={user.role} />
        </nav>
        <UserFooter user={user} />
      </aside>

      <header className="bg-card/85 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md lg:hidden">
        <MobileNav
          role={user.role}
          brand={<Brand dark />}
          footer={<UserFooter user={user} />}
        />
        <Brand />
        <Avatar name={user.name} size="sm" className="ml-auto" />
      </header>
    </>
  );
}
