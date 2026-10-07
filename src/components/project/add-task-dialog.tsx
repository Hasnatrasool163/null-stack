"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createTask } from "@/components/board/api";
import { Button } from "@/components/ui/button";
import { Modal, selectClass } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

type Person = { id: string; name: string };

/** "Add task" button + form for admins and the project's manager. */
export function AddTaskDialog({
  projectId,
  projectDeadline,
  developers,
}: {
  projectId: string;
  projectDeadline: string;
  developers: Person[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden /> Add task
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Add task">
        {open && (
          <AddTaskForm
            projectId={projectId}
            projectDeadline={projectDeadline}
            developers={developers}
            onDone={() => setOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}

function AddTaskForm({
  projectId,
  projectDeadline,
  developers,
  onDone,
}: {
  projectId: string;
  projectDeadline: string;
  developers: Person[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(developers[0]?.id ?? "");
  const [deadline, setDeadline] = useState(projectDeadline);
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoursNum = Number(hours);
  const late = !!deadline && deadline > projectDeadline;
  const valid = title.trim() && assigneeId && deadline && !late && hoursNum > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        assigneeId,
        deadline,
        estimatedHours: hoursNum,
      });
      toast.success("Task added");
      onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the task.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="t-title">Title</Label>
        <Input
          id="t-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-desc">Description</Label>
        <Textarea
          id="t-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          className="min-h-24"
          placeholder="What needs to be done, and what is out of scope"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-assignee">Assigned developer</Label>
        <select
          id="t-assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={selectClass}
        >
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div className="space-y-1.5">
          <Label htmlFor="t-deadline">Deadline</Label>
          <Input
            id="t-deadline"
            type="date"
            value={deadline}
            max={projectDeadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={late || undefined}
            aria-describedby="t-deadline-help"
            required
          />
          <p
            id="t-deadline-help"
            className={
              late
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
            }
          >
            Project is due {projectDeadline}.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-hours">Est. hours</Label>
          <Input
            id="t-hours"
            type="number"
            inputMode="decimal"
            min="0.5"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-500/30 dark:bg-red-500/10"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving && <Spinner />} Add task
        </Button>
      </div>
    </form>
  );
}
