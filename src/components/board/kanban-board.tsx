"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, MessageSquare, Search, SearchX } from "lucide-react";
import { boardKeys, fetchTasks, patchTask } from "@/components/board/api";
import { TaskDrawer } from "@/components/board/task-drawer";
import { DueBadge } from "@/components/due-badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { formatHours } from "@/lib/format";
import { STATUS_META } from "@/lib/task-meta";
import { TASK_STATUSES, type BoardTask, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string };

const selectCls =
  "border-input bg-card h-10 cursor-pointer rounded-lg border px-3 text-sm shadow-xs transition-colors hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none";

export function KanbanBoard({
  initialTasks,
  developers,
  currentUserId,
  today,
}: {
  initialTasks: BoardTask[];
  developers: Person[];
  currentUserId: string;
  today: string;
}) {
  const qc = useQueryClient();
  const { data: tasks = initialTasks } = useQuery({
    queryKey: boardKeys.tasks,
    queryFn: fetchTasks,
    initialData: initialTasks,
    refetchInterval: 30_000,
  });

  const [q, setQ] = useState("");
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      patchTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: boardKeys.tasks });
      const prev = qc.getQueryData<BoardTask[]>(boardKeys.tasks);
      qc.setQueryData<BoardTask[]>(boardKeys.tasks, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(boardKeys.tasks, ctx.prev);
      toast.error(e instanceof Error ? e.message : "Could not move the task.");
    },
    onSuccess: (task) => {
      qc.setQueryData<BoardTask[]>(boardKeys.tasks, (old) =>
        old?.map((t) => (t.id === task.id ? task : t)),
      );
      toast.success(`Moved to ${STATUS_META[task.status].label}`);
    },
  });

  const projects = useMemo(
    () =>
      [
        ...new Map(tasks.map((t) => [t.projectId, t.projectName])).entries(),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [tasks],
  );
  const assignees = useMemo(
    () =>
      [
        ...new Map(tasks.map((t) => [t.assigneeId, t.assigneeName])).entries(),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [tasks],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!project || t.projectId === project) &&
        (!assignee || t.assigneeId === assignee) &&
        (!needle ||
          [t.title, t.description, t.projectName, t.assigneeName].some((v) =>
            v.toLowerCase().includes(needle),
          )),
    );
  }, [tasks, q, project, assignee]);

  const filtered = q || project || assignee;
  const open = tasks.find((t) => t.id === openId) ?? null;

  function drop(status: TaskStatus) {
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    setOverCol(null);
    if (!task || task.status === status) return;
    if (!task.canUpdate) {
      toast.error("You cannot move this task.");
      return;
    }
    move.mutate({ id: task.id, status });
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />
          <label htmlFor="board-search" className="sr-only">
            Search tasks
          </label>
          <Input
            id="board-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 pl-9"
          />
        </div>
        {projects.length > 1 && (
          <>
            <label htmlFor="board-project" className="sr-only">
              Filter by project
            </label>
            <select
              id="board-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className={selectCls}
            >
              <option value="">All projects</option>
              {projects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </>
        )}
        {assignees.length > 1 && (
          <>
            <label htmlFor="board-assignee" className="sr-only">
              Filter by assignee
            </label>
            <select
              id="board-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={selectCls}
            >
              <option value="">Everyone</option>
              {assignees.map(([id, name]) => (
                <option key={id} value={id}>
                  {id === currentUserId ? `${name} (me)` : name}
                </option>
              ))}
            </select>
          </>
        )}
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setProject("");
              setAssignee("");
            }}
            className="text-muted-foreground hover:text-foreground h-10 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors"
          >
            Clear filters
          </button>
        )}
        <p className="text-muted-foreground ml-auto text-sm" role="status">
          {shown.length} of {tasks.length} tasks
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" aria-hidden />}
          title="No tasks yet"
        >
          Tasks created from meeting transcripts will appear here.
        </EmptyState>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="grid min-w-[60rem] grid-cols-4 gap-4">
            {TASK_STATUSES.map((status, ci) => {
              const col = shown.filter((t) => t.status === status);
              const meta = STATUS_META[status];
              const hours = col.reduce((n, t) => n + t.estimatedHours, 0);
              return (
                <section
                  key={status}
                  aria-labelledby={`col-${status}`}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    setOverCol(status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      setOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    drop(status);
                  }}
                  style={{ animationDelay: `${ci * 50}ms` }}
                  className={cn(
                    "animate-fade-up flex min-h-[24rem] flex-col rounded-xl border p-2 transition-colors duration-200",
                    meta.column,
                    overCol === status &&
                      "border-primary/50 ring-primary/10 bg-accent/60 ring-4",
                  )}
                >
                  <header className="flex items-center gap-2 px-2 pt-1.5 pb-3">
                    <span
                      className={cn("h-2 w-2 rounded-full", meta.dot)}
                      aria-hidden
                    />
                    <h2 id={`col-${status}`} className="text-sm font-semibold">
                      {meta.label}
                    </h2>
                    <span className="bg-card text-muted-foreground rounded-full border px-2 text-xs font-medium tabular-nums">
                      {col.length}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                      {formatHours(hours)}
                    </span>
                  </header>
                  <ul className="flex flex-1 flex-col gap-2">
                    {col.map((t) => (
                      <li key={t.id}>
                        <TaskCard
                          task={t}
                          today={today}
                          dragging={dragId === t.id}
                          onOpen={() => setOpenId(t.id)}
                          onDragStart={() => setDragId(t.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverCol(null);
                          }}
                        />
                      </li>
                    ))}
                    {col.length === 0 && (
                      <li className="text-muted-foreground border-input grid flex-1 place-items-center rounded-lg border border-dashed p-6 text-center text-xs">
                        {dragId
                          ? "Drop here"
                          : filtered
                            ? "No matching tasks"
                            : "No tasks"}
                      </li>
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <TaskDrawer
        task={open}
        developers={developers}
        today={today}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function TaskCard({
  task: t,
  today,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: BoardTask;
  today: string;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable={t.canUpdate}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", t.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      aria-label={`${t.title}, ${STATUS_META[t.status].label}, assigned to ${t.assigneeName}. Open details`}
      className={cn(
        "bg-card group w-full cursor-pointer rounded-lg border p-3 text-left shadow-xs transition-[box-shadow,border-color,opacity,transform] duration-200",
        "hover:shadow-lift focus-visible:ring-ring hover:border-primary/35 focus-visible:ring-2 focus-visible:outline-none",
        t.canUpdate && "active:cursor-grabbing",
        dragging && "scale-[0.98] opacity-50",
      )}
    >
      <p className="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase">
        {t.projectName}
      </p>
      <p className="mt-1 text-sm leading-snug font-medium">{t.title}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <DueBadge deadline={t.deadline} today={today} />
        <span className="text-muted-foreground text-xs font-medium tabular-nums">
          {formatHours(t.estimatedHours)}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t pt-2.5">
        <Avatar name={t.assigneeName} size="sm" />
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
          {t.assigneeName}
        </span>
        {t.links.length > 0 && (
          <span
            className="text-muted-foreground inline-flex items-center gap-1 text-xs"
            title="Links"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            {t.links.length}
          </span>
        )}
        {t.commentCount > 0 && (
          <span
            className="text-muted-foreground inline-flex items-center gap-1 text-xs"
            title="Comments"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {t.commentCount}
          </span>
        )}
      </div>
    </button>
  );
}
