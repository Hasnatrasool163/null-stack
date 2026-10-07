"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Clock3,
  Rows3,
  UsersRound,
} from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { StatusBadge } from "@/components/status-badge";
import { Person } from "@/components/ui/avatar";
import { formatDate, formatHours } from "@/lib/format";
import { TASK_STATUSES, type Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "title" | "assignee" | "status" | "deadline" | "hours";
type Sort = { key: SortKey; dir: 1 | -1 };

const COMPARE: Record<SortKey, (a: Task, b: Task) => number> = {
  title: (a, b) => a.title.localeCompare(b.title),
  assignee: (a, b) => a.assigneeName.localeCompare(b.assigneeName),
  status: (a, b) =>
    TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status),
  deadline: (a, b) => a.deadline.localeCompare(b.deadline),
  hours: (a, b) => a.estimatedHours - b.estimatedHours,
};

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
      }
      className={cn("px-5 py-2 font-medium", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "hover:text-foreground focus-visible:ring-ring -mx-1.5 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded px-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon
          className={cn("h-3.5 w-3.5", !active && "opacity-40")}
          aria-hidden
        />
      </button>
    </th>
  );
}

/** Task title; a button that opens the task when `onOpen` is given. */
function TaskTitle({
  task,
  onOpen,
  className,
}: {
  task: Task;
  onOpen?: (id: string) => void;
  className?: string;
}) {
  if (!onOpen)
    return (
      <span className={cn("block font-semibold", className)}>{task.title}</span>
    );
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className={cn(
        "hover:text-primary focus-visible:ring-ring block cursor-pointer rounded text-left font-semibold transition-colors after:absolute after:inset-0 focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {task.title}
    </button>
  );
}

export function TaskTable({
  tasks,
  today,
  onOpen,
}: {
  tasks: Task[];
  today: string;
  /** Makes each row open the task (e.g. in the task drawer). */
  onOpen?: (id: string) => void;
}) {
  const [sort, setSort] = useState<Sort>({ key: "deadline", dir: 1 });
  const [grouped, setGrouped] = useState(false);
  const total = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => COMPARE[sort.key](a, b) * sort.dir || COMPARE.title(a, b),
      ),
    [tasks, sort],
  );
  const groups = useMemo(() => {
    if (!grouped) return [{ name: "", tasks: sorted }];
    const m = new Map<string, Task[]>();
    for (const t of sorted)
      m.set(t.assigneeName, [...(m.get(t.assigneeName) ?? []), t]);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, ts]) => ({ name, tasks: ts }));
  }, [sorted, grouped]);

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 },
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="bg-secondary inline-flex rounded-lg border p-0.5"
          role="group"
          aria-label="Layout"
        >
          {[
            { on: false, label: "List", icon: Rows3 },
            { on: true, label: "By assignee", icon: UsersRound },
          ].map(({ on, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              aria-pressed={grouped === on}
              onClick={() => setGrouped(on)}
              className={cn(
                "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-[background-color,color,box-shadow] duration-200",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                grouped === on
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <label className="text-muted-foreground flex items-center gap-2 text-xs md:hidden">
          Sort
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              setSort({ key: key as SortKey, dir: dir === "-1" ? -1 : 1 });
            }}
            className="border-input bg-card text-foreground h-9 cursor-pointer rounded-lg border px-2 text-sm"
          >
            <option value="deadline:1">Deadline (soonest)</option>
            <option value="deadline:-1">Deadline (latest)</option>
            <option value="hours:-1">Hours (most)</option>
            <option value="status:1">Status</option>
            <option value="title:1">Title (A-Z)</option>
          </select>
        </label>
      </div>

      {/* Desktop / tablet: a real table */}
      <div className="bg-card shadow-card hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Tasks, sortable by column</caption>
          <thead className="bg-muted/60 text-muted-foreground border-b text-xs">
            <tr>
              <SortHeader label="Task" k="title" sort={sort} onSort={onSort} />
              <SortHeader
                label="Assigned to"
                k="assignee"
                sort={sort}
                onSort={onSort}
              />
              <SortHeader
                label="Status"
                k="status"
                sort={sort}
                onSort={onSort}
              />
              <SortHeader
                label="Deadline"
                k="deadline"
                sort={sort}
                onSort={onSort}
              />
              <SortHeader
                label="Est. hours"
                k="hours"
                sort={sort}
                onSort={onSort}
                align="right"
              />
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody
              key={g.name || "all"}
              className="divide-y border-b last:border-b-0"
            >
              {grouped && (
                <tr className="bg-muted/30">
                  <th
                    scope="rowgroup"
                    colSpan={5}
                    className="px-5 py-2 text-left"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <Person name={g.name} />
                      <span className="text-muted-foreground text-xs font-medium tabular-nums">
                        {g.tasks.length}{" "}
                        {g.tasks.length === 1 ? "task" : "tasks"} ·{" "}
                        {formatHours(
                          g.tasks.reduce((n, t) => n + t.estimatedHours, 0),
                        )}
                      </span>
                    </span>
                  </th>
                </tr>
              )}
              {g.tasks.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    "hover:bg-muted/40 align-top transition-colors",
                    onOpen && "relative cursor-pointer",
                  )}
                >
                  <th scope="row" className="max-w-md px-5 py-4 font-normal">
                    <TaskTitle task={t} onOpen={onOpen} />
                    <span className="text-muted-foreground mt-1 block leading-relaxed">
                      {t.description || "No description."}
                    </span>
                  </th>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Person name={t.assigneeName} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="block">{formatDate(t.deadline)}</span>
                    <DueBadge
                      deadline={t.deadline}
                      today={today}
                      className="mt-1.5"
                    />
                  </td>
                  <td className="px-5 py-4 text-right font-medium whitespace-nowrap tabular-nums">
                    {formatHours(t.estimatedHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
          <tfoot>
            <tr className="bg-muted/40 border-t font-semibold">
              <td colSpan={4} className="px-5 py-3.5 text-right">
                Total estimated effort
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums">
                {formatHours(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: stacked cards, same data */}
      <div className="space-y-5 md:hidden">
        {groups.map((g) => (
          <div key={g.name || "all"} className="space-y-3">
            {grouped && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <Person name={g.name} />
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatHours(
                    g.tasks.reduce((n, t) => n + t.estimatedHours, 0),
                  )}
                </span>
              </div>
            )}
            <ul
              className="stagger space-y-3"
              aria-label={grouped ? `Tasks for ${g.name}` : "Tasks"}
            >
              {g.tasks.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "bg-card shadow-card rounded-xl border p-4",
                    onOpen &&
                      "hover:border-primary/35 relative transition-colors",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <TaskTitle task={t} onOpen={onOpen} />
                    <span className="bg-secondary shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {formatHours(t.estimatedHours)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {t.description || "No description."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                    <Person name={t.assigneeName} />
                    <StatusBadge status={t.status} />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden
                      />
                      {formatDate(t.deadline)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="bg-secondary flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" aria-hidden /> Total estimated effort
          </span>
          <span className="tabular-nums">{formatHours(total)}</span>
        </div>
      </div>
    </div>
  );
}
