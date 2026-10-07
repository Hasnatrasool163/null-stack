import Link from "next/link";
import { CalendarDays, ListChecks, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="focus-visible:ring-ring block rounded-lg focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="hover:border-primary h-full transition-colors">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <p className="text-muted-foreground text-sm">{project.clientName}</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <User className="text-muted-foreground h-4 w-4" aria-hidden />
            <span className="sr-only">Manager:</span>
            {project.managerName}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays
              className="text-muted-foreground h-4 w-4"
              aria-hidden
            />
            <span className="sr-only">Deadline:</span>
            {formatDate(project.deadline)}
          </p>
          <Badge className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
