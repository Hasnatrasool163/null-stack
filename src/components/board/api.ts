import type {
  BoardTask,
  Project,
  TaskComment,
  TaskLink,
  TaskStatus,
} from "@/lib/types";

export type TaskUpdate = Partial<{
  status: TaskStatus;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number;
  links: TaskLink[];
}>;

async function json<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok)
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export const boardKeys = {
  tasks: ["board", "tasks"] as const,
  comments: (id: string) => ["board", "comments", id] as const,
};

export async function fetchTasks(): Promise<BoardTask[]> {
  return (await json<{ tasks: BoardTask[] }>(await fetch("/api/tasks"))).tasks;
}

export async function patchTask(
  id: string,
  update: TaskUpdate,
): Promise<BoardTask> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  return (await json<{ task: BoardTask }>(res)).task;
}

export async function fetchComments(id: string): Promise<TaskComment[]> {
  return (
    await json<{ comments: TaskComment[] }>(
      await fetch(`/api/tasks/${id}/comments`),
    )
  ).comments;
}

export async function postComment(
  id: string,
  body: string,
): Promise<TaskComment> {
  const res = await fetch(`/api/tasks/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return (await json<{ comment: TaskComment }>(res)).comment;
}

export type NewTask = {
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number;
};

export async function createTask(
  projectId: string,
  task: NewTask,
): Promise<BoardTask> {
  const res = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return (await json<{ task: BoardTask }>(res)).task;
}

export async function deleteTask(id: string): Promise<void> {
  await json<{ deleted: string }>(
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }),
  );
}

export type ProjectUpdate = Partial<{
  name: string;
  clientName: string;
  description: string;
  deadline: string;
  managerId: string;
}>;

export async function patchProject(
  id: string,
  update: ProjectUpdate,
): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  return (await json<{ project: Project }>(res)).project;
}

export async function deleteProject(id: string): Promise<void> {
  await json<{ deleted: string }>(
    await fetch(`/api/projects/${id}`, { method: "DELETE" }),
  );
}
