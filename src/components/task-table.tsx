import { CalendarDays, Clock3 } from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { Person } from "@/components/ui/avatar";
import { formatDate, formatHours, todayYmd } from "@/lib/format";
import type { Task } from "@/lib/types";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const total = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const today = todayYmd();
  return (
    <>
      {/* Desktop / tablet: a real table */}
      <div className="bg-card shadow-card hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Tasks</caption>
          <thead className="bg-muted/60 text-muted-foreground border-b text-xs">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Task</th>
              <th scope="col" className="px-5 py-3 font-medium">Assigned to</th>
              <th scope="col" className="px-5 py-3 font-medium">Deadline</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Est. hours</th>
            </tr>
          </thead>
          <tbody className="stagger divide-y">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-muted/40 align-top transition-colors">
                <th scope="row" className="max-w-md px-5 py-4 font-normal">
                  <span className="block font-semibold">{t.title}</span>
                  <span className="text-muted-foreground mt-1 block leading-relaxed">
                    {t.description || "No description."}
                  </span>
                </th>
                <td className="px-5 py-4 whitespace-nowrap">
                  <Person name={t.assigneeName} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="block">{formatDate(t.deadline)}</span>
                  <DueBadge deadline={t.deadline} today={today} className="mt-1.5" />
                </td>
                <td className="px-5 py-4 text-right font-medium whitespace-nowrap tabular-nums">
                  {formatHours(t.estimatedHours)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/40 border-t font-semibold">
              <td colSpan={3} className="px-5 py-3.5 text-right">
                Total estimated effort
              </td>
              <td className="text-primary px-5 py-3.5 text-right tabular-nums">
                {formatHours(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: stacked cards, same data */}
      <ul className="stagger space-y-3 md:hidden" aria-label="Tasks">
        {tasks.map((t) => (
          <li key={t.id} className="bg-card shadow-card rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{t.title}</p>
              <span className="bg-accent text-accent-foreground shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums">
                {formatHours(t.estimatedHours)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t.description || "No description."}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
              <Person name={t.assigneeName} />
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden />
                {formatDate(t.deadline)}
              </span>
            </div>
          </li>
        ))}
        <li className="bg-accent text-accent-foreground flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" aria-hidden /> Total estimated effort
          </span>
          <span className="tabular-nums">{formatHours(total)}</span>
        </li>
      </ul>
    </>
  );
}
