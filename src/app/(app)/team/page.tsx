import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { requireUser } from "@/lib/session";
import { getTeam } from "@/lib/team";

export const metadata: Metadata = { title: "Team | NovaWorks" };

const ROLE_LABEL = { ADMIN: "Admin", MANAGER: "Manager", AGENT: "Developer" };

export default async function TeamPage() {
  await requireUser();
  const team = await getTeam();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle>{m.name}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {ROLE_LABEL[m.role]} · {m.specialization}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {m.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
