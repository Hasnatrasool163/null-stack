"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TaskDrawer } from "@/components/board/task-drawer";
import { TaskTable } from "@/components/task-table";
import type { BoardTask } from "@/lib/types";

/** Project task table whose rows open the task drawer (view, edit, reassign, delete). */
export function ProjectTasks({
  tasks,
  developers,
  today,
}: {
  tasks: BoardTask[];
  developers: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tasks.find((t) => t.id === openId) ?? null;
  return (
    <>
      <TaskTable tasks={tasks} today={today} onOpen={setOpenId} />
      <TaskDrawer
        task={open}
        developers={developers}
        today={today}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </>
  );
}
