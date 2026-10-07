import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TaskTable } from "@/components/task-table";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectById } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Project | NovaWorks" };

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getProjectById(user, id);
  if (!detail) notFound();
  const { project, tasks } = detail;
  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All projects
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          {project.description || "No description."}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <dl className="grid gap-4 sm:grid-cols-3">
            <Fact label="Client" value={project.clientName} />
            <Fact label="Project manager" value={project.managerName} />
            <Fact label="Deadline" value={formatDate(project.deadline)} />
          </dl>
        </CardContent>
      </Card>
      <section aria-labelledby="tasks-heading" className="space-y-3">
        <h2 id="tasks-heading" className="text-lg font-semibold">
          Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              No tasks to show for this project.
            </CardContent>
          </Card>
        ) : (
          <TaskTable tasks={tasks} />
        )}
      </section>
    </div>
  );
}
