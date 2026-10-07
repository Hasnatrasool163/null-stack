import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/types";

export const ROLE_LABEL = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Developer",
};

function Brand() {
  return (
    <Link
      href="/"
      aria-label="NullToPlan home"
      className="focus-visible:ring-ring inline-flex rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Logo />
    </Link>
  );
}

function UserFooter({ user }: { user: SessionUser }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <ThemeToggle className="flex w-full" />
      <div className="flex items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground text-xs">
            {ROLE_LABEL[user.role]}
          </p>
        </div>
        <form method="post" action="/api/auth/logout">
          <button
            type="submit"
            className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring grid h-10 w-10 cursor-pointer place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

/** Desktop: fixed light sidebar. Mobile: sticky top bar with a drawer. */
export function Nav({ user }: { user: SessionUser }) {
  return (
    <>
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 lg:flex">
        <div className="px-2 pt-1 pb-8">
          <Brand />
        </div>
        <p className="text-sidebar-muted px-3 pb-2 text-[11px] font-medium tracking-wider uppercase">
          Workspace
        </p>
        <nav aria-label="Main" className="flex-1">
          <NavLinks role={user.role} />
        </nav>
        <UserFooter user={user} />
      </aside>

      <header className="bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md lg:hidden">
        <MobileNav
          role={user.role}
          brand={<Brand />}
          footer={<UserFooter user={user} />}
        />
        <Brand />
        <Avatar name={user.name} size="sm" className="ml-auto" />
      </header>
    </>
  );
}
