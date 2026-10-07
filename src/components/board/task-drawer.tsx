"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  FolderKanban,
  Link2,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  boardKeys,
  deleteTask,
  fetchComments,
  patchTask,
  postComment,
  type TaskUpdate,
} from "@/components/board/api";
import { DueBadge } from "@/components/due-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { formatDate, formatHours } from "@/lib/format";
import { formatDateTime, STATUS_META, timeAgo } from "@/lib/task-meta";
import { TASK_STATUSES, type BoardTask, type TaskComment } from "@/lib/types";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string };
const ROLE = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Developer",
} as const;

/** Right-side sheet with every task detail, editing, links and the discussion thread. */
export function TaskDrawer({
  task,
  developers,
  today,
  onClose,
  onChanged,
}: {
  task: BoardTask | null;
  developers: Person[];
  today: string;
  onClose: () => void;
  /** Called after any successful change, e.g. to refresh a server-rendered page. */
  onChanged?: () => void;
}) {
  return (
    <Dialog.Root open={!!task} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content
          className="bg-background data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l shadow-2xl duration-300"
          aria-describedby={undefined}
        >
          {task && (
            <DrawerBody
              key={task.id}
              task={task}
              developers={developers}
              today={today}
              onChanged={onChanged}
              onDeleted={onClose}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function useTaskUpdate(taskId: string, onChanged?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (u: TaskUpdate) => patchTask(taskId, u),
    onSuccess: (task) => {
      qc.setQueryData<BoardTask[]>(boardKeys.tasks, (old) =>
        old?.map((t) => (t.id === task.id ? task : t)),
      );
      onChanged?.();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not save."),
  });
}

function DrawerBody({
  task,
  developers,
  today,
  onChanged,
  onDeleted,
}: {
  task: BoardTask;
  developers: Person[];
  today: string;
  onChanged?: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const update = useTaskUpdate(task.id, onChanged);

  return (
    <>
      <header className="flex items-start gap-3 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <FolderKanban className="h-3.5 w-3.5" aria-hidden />
            <Link
              href={`/projects/${task.projectId}`}
              className="hover:text-foreground truncate transition-colors"
            >
              {task.projectName}
            </Link>
          </p>
          <Dialog.Title className="mt-1 text-lg leading-snug font-semibold tracking-tight">
            {task.title}
          </Dialog.Title>
        </div>
        {task.canEdit && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
          </Button>
        )}
        <Dialog.Close
          className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring -mr-2 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </Dialog.Close>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-5 py-5 sm:px-6">
          <StatusPicker
            task={task}
            pending={update.isPending}
            onChange={(status) =>
              update.mutate(
                { status },
                {
                  onSuccess: () =>
                    toast.success(`Moved to ${STATUS_META[status].label}`),
                },
              )
            }
          />

          {editing ? (
            <EditForm
              task={task}
              developers={developers}
              saving={update.isPending}
              onCancel={() => setEditing(false)}
              onSave={(u) =>
                update.mutate(u, {
                  onSuccess: () => {
                    setEditing(false);
                    toast.success("Task updated");
                  },
                })
              }
            />
          ) : (
            <>
              <section aria-label="Description">
                <h3 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wider uppercase">
                  Description
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {task.description || "No description."}
                </p>
              </section>
              <Details task={task} today={today} />
            </>
          )}

          <Links
            task={task}
            onSave={(links) => update.mutate({ links })}
            saving={update.isPending}
          />
          <Thread task={task} />
          {task.canEdit && (
            <DeleteTask
              task={task}
              onDeleted={() => {
                onDeleted();
                onChanged?.();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StatusPicker({
  task,
  pending,
  onChange,
}: {
  task: BoardTask;
  pending: boolean;
  onChange: (s: BoardTask["status"]) => void;
}) {
  return (
    <fieldset disabled={!task.canUpdate || pending}>
      <legend className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wider uppercase">
        Status
      </legend>
      <div className="bg-secondary grid grid-cols-2 gap-1 rounded-lg border p-1 sm:grid-cols-4">
        {TASK_STATUSES.map((s) => {
          const active = task.status === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => !active && onChange(s)}
              className={cn(
                "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-[background-color,color,box-shadow] duration-200 disabled:cursor-not-allowed",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)}
                aria-hidden
              />
              {STATUS_META[s].label}
            </button>
          );
        })}
      </div>
      {!task.canUpdate && (
        <p className="text-muted-foreground mt-1.5 text-xs">
          Only the assignee, the project manager or an admin can change the
          status.
        </p>
      )}
    </fieldset>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <dt className="text-muted-foreground flex w-36 shrink-0 items-center gap-2 text-sm">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

function Details({ task, today }: { task: BoardTask; today: string }) {
  const icon = "h-4 w-4";
  return (
    <section aria-label="Details">
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        Details
      </h3>
      <dl className="divide-y rounded-lg border px-4">
        <Row
          icon={<UserRound className={icon} aria-hidden />}
          label="Assigned to"
        >
          <span className="inline-flex items-center gap-2">
            <Avatar name={task.assigneeName} size="sm" /> {task.assigneeName}
          </span>
        </Row>
        <Row
          icon={<UserRound className={icon} aria-hidden />}
          label="Project manager"
        >
          {task.managerName}
        </Row>
        <Row
          icon={<CalendarDays className={icon} aria-hidden />}
          label="Deadline"
        >
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatDate(task.deadline)}{" "}
            <DueBadge deadline={task.deadline} today={today} />
          </span>
        </Row>
        <Row
          icon={<Clock3 className={icon} aria-hidden />}
          label="Estimated effort"
        >
          <span className="tabular-nums">
            {formatHours(task.estimatedHours)}
          </span>
        </Row>
        <Row
          icon={<UserRound className={icon} aria-hidden />}
          label="Reported by"
        >
          {task.reportedByName ?? "Unknown"}
        </Row>
        <Row
          icon={<CalendarDays className={icon} aria-hidden />}
          label="Created"
        >
          {formatDateTime(task.createdAt)}
        </Row>
        <Row icon={<Pencil className={icon} aria-hidden />} label="Last edited">
          {task.updatedByName ?? "Unknown"}
          <span className="text-muted-foreground font-normal">
            {" "}
            · {timeAgo(task.updatedAt)}
          </span>
        </Row>
      </dl>
    </section>
  );
}

function EditForm({
  task,
  developers,
  saving,
  onCancel,
  onSave,
}: {
  task: BoardTask;
  developers: Person[];
  saving: boolean;
  onCancel: () => void;
  onSave: (u: TaskUpdate) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [deadline, setDeadline] = useState(task.deadline);
  const [hours, setHours] = useState(String(task.estimatedHours));
  const hoursNum = Number(hours);
  const valid =
    title.trim() && deadline && Number.isFinite(hoursNum) && hoursNum > 0;

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || saving) return;
        onSave({
          title: title.trim(),
          description: description.trim(),
          assigneeId,
          deadline,
          estimatedHours: hoursNum,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-desc">Description</Label>
        <Textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          className="min-h-28"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="edit-assignee">Assigned to</Label>
          <select
            id="edit-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="border-input bg-card focus-visible:ring-ring h-11 w-full cursor-pointer rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="edit-deadline">Deadline</Label>
          <Input
            id="edit-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-hours">Hours</Label>
          <Input
            id="edit-hours"
            type="number"
            inputMode="decimal"
            min="0.5"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            aria-invalid={!(hoursNum > 0) || undefined}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving && <Spinner />} Save changes
        </Button>
      </div>
    </form>
  );
}

function Links({
  task,
  saving,
  onSave,
}: {
  task: BoardTask;
  saving: boolean;
  onSave: (links: BoardTask["links"]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const validUrl = /^https?:\/\/\S+\.\S+/i.test(url.trim());

  return (
    <section aria-labelledby="links-heading">
      <div className="mb-1.5 flex items-center justify-between">
        <h3
          id="links-heading"
          className="text-muted-foreground text-xs font-medium tracking-wider uppercase"
        >
          Resources
        </h3>
        {task.canUpdate && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-muted-foreground hover:text-foreground inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add link
          </button>
        )}
      </div>
      {task.links.length === 0 && !adding && (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
          No links yet. Add Figma designs, docs or references.
        </p>
      )}
      {task.links.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {task.links.map((l, i) => (
            <li
              key={`${l.url}-${i}`}
              className="group flex items-center gap-3 px-3 py-2"
            >
              <span className="bg-secondary grid h-8 w-8 shrink-0 place-items-center rounded-md border">
                <Link2 className="h-4 w-4" aria-hidden />
              </span>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 text-sm hover:underline"
              >
                <span className="block truncate font-medium">{l.label}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {l.url}
                </span>
              </a>
              <ExternalLink
                className="text-muted-foreground h-4 w-4 shrink-0"
                aria-hidden
              />
              {task.canUpdate && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSave(task.links.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive grid h-8 w-8 cursor-pointer place-items-center rounded-md transition-colors"
                  aria-label={`Remove link ${l.label}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <form
          className="mt-2 grid gap-2 rounded-lg border p-3 sm:grid-cols-[10rem_minmax(0,1fr)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim() || !validUrl) return;
            onSave([...task.links, { label: label.trim(), url: url.trim() }]);
            setLabel("");
            setUrl("");
            setAdding(false);
          }}
        >
          <label htmlFor="link-label" className="sr-only">
            Link name
          </label>
          <Input
            id="link-label"
            placeholder="Figma design"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            className="h-10"
          />
          <label htmlFor="link-url" className="sr-only">
            URL
          </label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={500}
            className="h-10"
            aria-invalid={(url.length > 0 && !validUrl) || undefined}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!label.trim() || !validUrl || saving}
            >
              Add link
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function Thread({ task }: { task: BoardTask }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const {
    data: comments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: boardKeys.comments(task.id),
    queryFn: () => fetchComments(task.id),
    refetchInterval: 15_000,
  });
  const send = useMutation({
    mutationFn: (text: string) => postComment(task.id, text),
    onSuccess: (c) => {
      qc.setQueryData<TaskComment[]>(boardKeys.comments(task.id), (old) => [
        ...(old ?? []),
        c,
      ]);
      qc.setQueryData<BoardTask[]>(boardKeys.tasks, (old) =>
        old?.map((t) =>
          t.id === task.id ? { ...t, commentCount: t.commentCount + 1 } : t,
        ),
      );
      setBody("");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not send."),
  });

  function submit() {
    const text = body.trim();
    if (text && !send.isPending) send.mutate(text);
  }

  return (
    <section aria-labelledby="thread-heading">
      <h3
        id="thread-heading"
        className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase"
      >
        Discussion {comments && comments.length > 0 && `(${comments.length})`}
      </h3>
      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Loading discussion...
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          Could not load the discussion.
        </p>
      ) : comments && comments.length > 0 ? (
        <ol className="space-y-4" aria-live="polite">
          {comments.map((c) => (
            <li key={c.id} className="animate-fade-in flex gap-3">
              <Avatar name={c.authorName} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-medium">{c.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {ROLE[c.authorRole]}
                  </span>
                  <time
                    className="text-muted-foreground text-xs"
                    dateTime={c.createdAt}
                    title={formatDateTime(c.createdAt)}
                  >
                    {timeAgo(c.createdAt)}
                  </time>
                </p>
                <p className="bg-secondary/70 mt-1 rounded-lg rounded-tl-sm border px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-line">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">
          No messages yet. Start the discussion.
        </p>
      )}

      {task.canUpdate && (
        <form
          className="bg-card focus-within:ring-ring/15 focus-within:border-foreground/40 mt-4 rounded-lg border transition-[border-color,box-shadow] focus-within:ring-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="comment" className="sr-only">
            Write a message
          </label>
          <textarea
            id="comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            maxLength={2000}
            rows={3}
            placeholder="Share an update or ask a question..."
            className="placeholder:text-muted-foreground/80 block w-full resize-none rounded-t-lg bg-transparent px-3 py-2.5 text-base focus:outline-none sm:text-sm"
          />
          <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
            <span className="text-muted-foreground pl-1 text-xs">
              ⌘/Ctrl + Enter to send
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || send.isPending}
            >
              {send.isPending ? (
                <Spinner />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden />
              )}
              Send
            </Button>
          </div>
        </form>
      )}
      <Link
        href={`/projects/${task.projectId}`}
        className="text-muted-foreground hover:text-foreground mt-6 inline-flex items-center gap-1 text-xs font-medium transition-colors"
      >
        View project <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}

function DeleteTask({
  task,
  onDeleted,
}: {
  task: BoardTask;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      qc.setQueryData<BoardTask[]>(boardKeys.tasks, (old) =>
        old?.filter((t) => t.id !== task.id),
      );
      toast.success("Task deleted");
      onDeleted();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not delete."),
  });

  return (
    <section aria-labelledby="danger-heading" className="border-t pt-5">
      <h3
        id="danger-heading"
        className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase"
      >
        Danger zone
      </h3>
      {confirming ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Delete this task and its discussion? This cannot be undone.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
          >
            {remove.isPending ? (
              <Spinner />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            )}{" "}
            Delete task
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          className="hover:border-destructive/40 hover:text-destructive hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete task
        </Button>
      )}
    </section>
  );
}
