import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { Card, CardContent } from "@/components/ui/card";
import { getProjects } from "@/lib/access";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Projects | NovaWorks" };

const EMPTY: Record<string, string> = {
  ADMIN: "No projects yet. Use Create from Transcript to generate them from a meeting.",
  MANAGER: "No projects are assigned to you yet.",
  AGENT: "No projects include tasks assigned to you yet.",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await getProjects(user);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-sm">
            {EMPTY[user.role]}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
