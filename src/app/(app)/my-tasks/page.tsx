import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyTasks } from "@/lib/access";
import { formatDate, formatHours } from "@/lib/format";
import { requireUser } from "@/lib/session";
import type { MyTask } from "@/lib/types";

export const metadata: Metadata = { title: "My Tasks | NovaWorks" };

function groupByProject(tasks: MyTask[]) {
  const groups = new Map<
    string,
    { projectId: string; projectName: string; managerName: string; tasks: MyTask[] }
  >();
  for (const t of tasks) {
    const g = groups.get(t.projectId) ?? {
      projectId: t.projectId,
      projectName: t.projectName,
      managerName: t.managerName,
      tasks: [],
    };
    g.tasks.push(t);
    groups.set(t.projectId, g);
  }
  return [...groups.values()];
}

export default async function MyTasksPage() {
  const user = await requireUser();
  if (user.role !== "AGENT") redirect("/projects");
  const groups = groupByProject(await getMyTasks(user));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Tasks</h1>
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-sm">
            No tasks are assigned to you yet.
          </CardContent>
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.projectId} aria-labelledby={`p-${g.projectId}`}>
            <div className="mb-3">
              <h2 id={`p-${g.projectId}`} className="text-lg font-semibold">
                <Link href={`/projects/${g.projectId}`} className="hover:underline">
                  {g.projectName}
                </Link>
              </h2>
              <p className="text-muted-foreground text-sm">
                Manager: {g.managerName}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {g.tasks.map((t) => (
                <Card key={t.id}>
                  <CardHeader>
                    <CardTitle>{t.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {t.description || "No description."}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 font-medium">
                      <span>Due {formatDate(t.deadline)}</span>
                      <span>{formatHours(t.estimatedHours)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
