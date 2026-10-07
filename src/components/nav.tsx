import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import type { SessionUser } from "@/lib/types";

const ROLE_LABEL = { ADMIN: "Admin", MANAGER: "Manager", AGENT: "Developer" };

export function Nav({ user }: { user: SessionUser }) {
  const links = [
    { href: "/projects", label: "Projects", show: true },
    { href: "/my-tasks", label: "My Tasks", show: user.role === "AGENT" },
    { href: "/team", label: "Team", show: true },
    {
      href: "/admin/transcript",
      label: "Create from Transcript",
      show: user.role === "ADMIN",
    },
  ];
  return (
    <header className="bg-card border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-primary text-lg font-bold">
          NovaWorks
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium">{user.name}</span>
          <Badge>{ROLE_LABEL[user.role]}</Badge>
          <form method="post" action="/api/auth/logout">
            <Button type="submit" variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
