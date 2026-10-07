"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteProject,
  patchProject,
  type ProjectUpdate,
} from "@/components/board/api";
import { Button } from "@/components/ui/button";
import { Modal, selectClass } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import type { Project } from "@/lib/types";

type Person = { id: string; name: string };

/** Edit / Delete controls on the project page (admin, or the project's manager). */
export function ProjectActions({
  project,
  managers,
  latestTaskDeadline,
}: {
  project: Project;
  managers: Person[];
  latestTaskDeadline: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit project
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDeleting(true)}
        className="hover:border-destructive/40 hover:text-destructive hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
      </Button>
      <Modal open={editing} onOpenChange={setEditing} title="Edit project">
        {editing && (
          <EditProjectForm
            project={project}
            managers={managers}
            latestTaskDeadline={latestTaskDeadline}
            onDone={() => setEditing(false)}
          />
        )}
      </Modal>
      <DeleteProjectDialog
        project={project}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </div>
  );
}

function EditProjectForm({
  project,
  managers,
  latestTaskDeadline,
  onDone,
}: {
  project: Project;
  managers: Person[];
  latestTaskDeadline: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.clientName);
  const [description, setDescription] = useState(project.description);
  const [deadline, setDeadline] = useState(project.deadline);
  const [managerId, setManagerId] = useState(project.managerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooEarly =
    !!latestTaskDeadline && !!deadline && deadline < latestTaskDeadline;
  const valid = name.trim() && clientName.trim() && deadline && !tooEarly;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    const update: ProjectUpdate = {};
    if (name.trim() !== project.name) update.name = name.trim();
    if (clientName.trim() !== project.clientName)
      update.clientName = clientName.trim();
    if (description.trim() !== project.description)
      update.description = description.trim();
    if (deadline !== project.deadline) update.deadline = deadline;
    if (project.canReassign && managerId !== project.managerId)
      update.managerId = managerId;
    if (Object.keys(update).length === 0) return onDone();
    setSaving(true);
    setError(null);
    try {
      await patchProject(project.id, update);
      toast.success("Project updated");
      onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Project name</Label>
        <Input
          id="p-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-client">Client</Label>
        <Input
          id="p-client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Description and scope</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          className="min-h-28"
          placeholder="What is included, and what is out of scope"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-deadline">Deadline</Label>
          <Input
            id="p-deadline"
            type="date"
            value={deadline}
            min={latestTaskDeadline ?? undefined}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={tooEarly || undefined}
            aria-describedby="p-deadline-help"
            required
          />
          <p
            id="p-deadline-help"
            className={
              tooEarly
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
            }
          >
            {latestTaskDeadline
              ? `Latest task is due ${latestTaskDeadline}.`
              : "No tasks yet."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-manager">Project manager</Label>
          <select
            id="p-manager"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            disabled={!project.canReassign}
            aria-describedby={
              project.canReassign ? undefined : "p-manager-help"
            }
            className={selectClass}
          >
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {!project.canReassign && (
            <p id="p-manager-help" className="text-muted-foreground text-xs">
              Only an admin can reassign the manager.
            </p>
          )}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm"
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
          {saving && <Spinner />} Save changes
        </Button>
      </div>
    </form>
  );
}

function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = confirm.trim() === project.name;

  async function remove() {
    if (!matches || busy) return;
    setBusy(true);
    try {
      await deleteProject(project.id);
      toast.success(`Deleted ${project.name}`);
      onOpenChange(false);
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirm("");
        onOpenChange(o);
      }}
      title="Delete project?"
      description={`This permanently deletes ${project.name}, its ${project.taskCount} ${project.taskCount === 1 ? "task" : "tasks"} and all their discussions. This cannot be undone.`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void remove();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="confirm-name">
            Type <span className="font-semibold">{project.name}</span> to
            confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!matches || busy}
          >
            {busy ? <Spinner /> : <Trash2 className="h-4 w-4" aria-hidden />}{" "}
            Delete project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
