import type { Metadata } from "next";
import { ROLE_LABEL } from "@/components/nav";
import { Avatar } from "@/components/ui/avatar";
import { Badge, PageHeader } from "@/components/ui/misc";
import { requireUser } from "@/lib/session";
import { getTeam } from "@/lib/team";
import type { Role, TeamMember } from "@/lib/types";

export const metadata: Metadata = { title: "Team | NovaWorks" };

const SECTIONS: { role: Role; title: string }[] = [
  { role: "ADMIN", title: "Administration" },
  { role: "MANAGER", title: "Project managers" },
  { role: "AGENT", title: "Developers" },
];

const ROLE_TONE = { ADMIN: "danger", MANAGER: "default", AGENT: "success" } as const;

function MemberCard({ m }: { m: TeamMember }) {
  return (
    <li className="bg-card shadow-card hover:shadow-lift rounded-xl border p-5 transition-shadow duration-300">
      <div className="flex items-start gap-4">
        <Avatar name={m.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{m.name}</h3>
            <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">{m.specialization}</p>
        </div>
      </div>
      {m.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${m.name}'s skills`}>
          {m.skills.map((s) => (
            <li key={s}>
              <Badge tone="outline">{s}</Badge>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default async function TeamPage() {
  await requireUser();
  const team = await getTeam();
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Directory"
        title="Team"
        description={`${team.length} people at NovaWorks: who they are and what they're good at.`}
      />
      {SECTIONS.map(({ role, title }) => {
        const members = team.filter((m) => m.role === role);
        if (members.length === 0) return null;
        return (
          <section key={role} aria-labelledby={`team-${role}`} className="space-y-4">
            <h2 id={`team-${role}`} className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {title} <span className="font-normal">· {members.length}</span>
            </h2>
            <ul className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((m) => (
                <MemberCard key={m.id} m={m} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
