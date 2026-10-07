import { formatDate, formatHours } from "@/lib/format";
import type { Task } from "@/lib/types";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const total = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  return (
    <div className="bg-card overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Tasks</caption>
        <thead className="bg-muted text-muted-foreground text-xs uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Task
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Description
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Assigned to
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Deadline
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Est. hours
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((t) => (
            <tr key={t.id} className="align-top">
              <th scope="row" className="px-4 py-3 font-semibold">
                {t.title}
              </th>
              <td className="text-muted-foreground max-w-sm px-4 py-3">
                {t.description || "-"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{t.assigneeName}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDate(t.deadline)}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                {formatHours(t.estimatedHours)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-semibold">
            <td colSpan={4} className="px-4 py-3 text-right">
              Total
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatHours(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
