import type { Metadata } from "next";
import { KanbanBoard } from "@/components/board/kanban-board";
import { PageHeader } from "@/components/ui/misc";
import { getBoardTasks } from "@/lib/access";
import { todayYmd } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { getTeam } from "@/lib/team";

export const metadata: Metadata = { title: "Board | NullToPlan" };

const SUBTITLE = {
  ADMIN: "Every task in the workspace. Drag a card to change its status.",
  MANAGER:
    "Tasks in the projects you manage. Drag a card to change its status.",
  AGENT: "Your tasks. Drag a card to change its status, or open it to comment.",
};

export default async function BoardPage() {
  const user = await requireUser();
  const [tasks, team] = await Promise.all([getBoardTasks(user), getTeam()]);
  const developers = team
    .filter((m) => m.role === "AGENT")
    .map((m) => ({ id: m.id, name: m.name }));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kanban"
        title="Board"
        description={SUBTITLE[user.role]}
      />
      <KanbanBoard
        initialTasks={tasks}
        developers={developers}
        currentUserId={user.id}
        today={todayYmd()}
      />
    </div>
  );
}
