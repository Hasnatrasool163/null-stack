import { query } from "@/lib/db";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { ProjectPatch, TaskCreate, TaskPatch } from "@/lib/schemas";
import type {
  AgendaItem,
  BoardTask,
  Meeting,
  MyTask,
  Project,
  ProjectDetail,
  SessionUser,
  Task,
  TaskComment,
  TaskLink,
  TaskStatus,
} from "@/lib/types";

/**
 * The ONLY module that queries projects and tasks. Every function takes the
 * server-verified user and scopes the SQL by role. SQL fragments below are
 * static strings; all values are bound parameters.
 */

type Scope = { where: string; countFilter: string; params: unknown[] };

function projectScope(user: SessionUser): Scope {
  switch (user.role) {
    case "ADMIN":
      return { where: "TRUE", countFilter: "TRUE", params: [] };
    case "MANAGER":
      return {
        where: "p.manager_id = $1",
        countFilter: "TRUE",
        params: [user.id],
      };
    case "AGENT":
      return {
        where:
          "EXISTS (SELECT 1 FROM tasks x WHERE x.project_id = p.id AND x.assignee_id = $1)",
        countFilter: "t.assignee_id = $1",
        params: [user.id],
      };
  }
}

type ProjectRow = {
  id: string;
  name: string;
  client_name: string;
  description: string;
  manager_id: string;
  manager_name: string;
  deadline: string;
  task_count: number;
};

function toProject(r: ProjectRow, user: SessionUser): Project {
  return {
    id: r.id,
    name: r.name,
    clientName: r.client_name,
    description: r.description,
    managerId: r.manager_id,
    managerName: r.manager_name,
    deadline: r.deadline,
    taskCount: r.task_count,
    canEdit:
      user.role === "ADMIN" ||
      (user.role === "MANAGER" && r.manager_id === user.id),
    canReassign: user.role === "ADMIN",
  };
}

async function queryProjects(
  user: SessionUser,
  projectId?: string,
): Promise<Project[]> {
  const scope = projectScope(user);
  const params = [...scope.params];
  let idFilter = "";
  if (projectId !== undefined) {
    params.push(projectId);
    idFilter = ` AND p.id = $${params.length}`;
  }
  const rows = await query<ProjectRow>(
    `SELECT p.id, p.name, p.client_name, p.description, p.manager_id,
            m.name AS manager_name, p.deadline,
            (SELECT count(*)::int FROM tasks t
              WHERE t.project_id = p.id AND ${scope.countFilter}) AS task_count
       FROM projects p
       JOIN users m ON m.id = p.manager_id
      WHERE ${scope.where}${idFilter}
      ORDER BY p.deadline, p.name`,
    params,
  );
  return rows.map((r) => toProject(r, user));
}

export function getProjects(user: SessionUser): Promise<Project[]> {
  return queryProjects(user);
}

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name: string;
  deadline: string;
  estimated_hours: number;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
  reported_by_name: string | null;
  updated_by_name: string | null;
  links: TaskLink[] | null;
  comment_count: number;
  project_name: string;
  manager_id: string;
  manager_name: string;
};

const TASK_SELECT = `SELECT t.id, t.project_id, t.title, t.description, t.assignee_id,
       a.name AS assignee_name, t.deadline, t.estimated_hours, t.status,
       t.created_at, t.updated_at, rb.name AS reported_by_name,
       ub.name AS updated_by_name, t.links,
       (SELECT count(*)::int FROM task_comments c WHERE c.task_id = t.id) AS comment_count,
       p.name AS project_name, p.manager_id, m.name AS manager_name
  FROM tasks t
  JOIN users a ON a.id = t.assignee_id
  JOIN projects p ON p.id = t.project_id
  JOIN users m ON m.id = p.manager_id
  LEFT JOIN users rb ON rb.id = t.reported_by
  LEFT JOIN users ub ON ub.id = t.updated_by`;

/** Which tasks a role may see. $1 is always the user id (unused for ADMIN). */
const TASK_SCOPE: Record<SessionUser["role"], string> = {
  // References $1 so Postgres can type the parameter even when it is unused.
  ADMIN: "$1::text IS NOT NULL",
  MANAGER: "p.manager_id = $1",
  AGENT: "t.assignee_id = $1",
};

function toBoardTask(r: TaskRow, user: SessionUser): BoardTask {
  const canEdit =
    user.role === "ADMIN" ||
    (user.role === "MANAGER" && r.manager_id === user.id);
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_name,
    deadline: r.deadline,
    estimatedHours: r.estimated_hours,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    reportedByName: r.reported_by_name,
    updatedByName: r.updated_by_name,
    links: Array.isArray(r.links) ? r.links : [],
    commentCount: r.comment_count,
    projectName: r.project_name,
    managerId: r.manager_id,
    managerName: r.manager_name,
    canEdit,
    canUpdate: canEdit || r.assignee_id === user.id,
  };
}

/**
 * The single task query. Always scoped to what this user may see; `filter`
 * is a static SQL fragment whose values start at $2.
 */
async function selectTasks(
  user: SessionUser,
  filter = "TRUE",
  params: unknown[] = [],
): Promise<BoardTask[]> {
  const rows = await query<TaskRow>(
    `${TASK_SELECT}
      WHERE (${TASK_SCOPE[user.role]}) AND (${filter})
      ORDER BY t.deadline, t.title`,
    [user.id, ...params],
  );
  return rows.map((r) => toBoardTask(r, user));
}

/** Tasks of one project that this user may see. */
export function getTasks(
  user: SessionUser,
  projectId: string,
): Promise<BoardTask[]> {
  return selectTasks(user, "t.project_id = $2", [projectId]);
}

/** Returns null (never 403) when the project is not visible to this user. */
export async function getProjectById(
  user: SessionUser,
  id: string,
): Promise<ProjectDetail | null> {
  const [project] = await queryProjects(user, id);
  if (!project) return null;
  const tasks = await getTasks(user, id);
  return { project, tasks };
}

/** Every task this user may see, across all visible projects, in one query. */
export function getVisibleTasks(user: SessionUser): Promise<Task[]> {
  return selectTasks(user);
}

/** Tasks for the Kanban board, with project context and permissions. */
export function getBoardTasks(user: SessionUser): Promise<BoardTask[]> {
  return selectTasks(user);
}

/** One task, or null when this user may not see it (never leaks existence). */
export async function getTaskById(
  user: SessionUser,
  id: string,
): Promise<BoardTask | null> {
  const [task] = await selectTasks(user, "t.id = $2", [id]);
  return task ?? null;
}

/** The signed-in user's own assigned tasks, with project context. */
export async function getMyTasks(user: SessionUser): Promise<MyTask[]> {
  const tasks = await selectTasks(user, "t.assignee_id = $1");
  return tasks.sort(
    (a, b) =>
      a.projectName.localeCompare(b.projectName) ||
      a.deadline.localeCompare(b.deadline) ||
      a.title.localeCompare(b.title),
  );
}

export type UpdateOutcome =
  | { ok: true; task: BoardTask }
  | { ok: false; status: 400 | 403 | 404; message: string };

const EDIT_ONLY = [
  "title",
  "description",
  "assigneeId",
  "deadline",
  "estimatedHours",
] as const;

/** Static column for each patchable field (values are always bound parameters). */
const COLUMN: Record<keyof z.infer<typeof TaskPatch>, string> = {
  status: "status",
  title: "title",
  description: "description",
  assigneeId: "assignee_id",
  deadline: "deadline",
  estimatedHours: "estimated_hours",
  links: "links",
};

/**
 * Admins and the project's manager may change anything. The assignee may
 * move the status and manage links. Everyone else gets 404.
 */
export async function updateTask(
  user: SessionUser,
  id: string,
  patch: z.infer<typeof TaskPatch>,
): Promise<UpdateOutcome> {
  const task = await getTaskById(user, id);
  if (!task) return { ok: false, status: 404, message: "Task not found." };
  if (!task.canUpdate) {
    return { ok: false, status: 403, message: "You cannot change this task." };
  }
  if (!task.canEdit && EDIT_ONLY.some((k) => patch[k] !== undefined)) {
    return {
      ok: false,
      status: 403,
      message: "Only the project manager or an admin can edit task details.",
    };
  }
  if (patch.assigneeId !== undefined) {
    const [u] = await query<{ role: string }>(
      "SELECT role FROM users WHERE id = $1",
      [patch.assigneeId],
    );
    if (u?.role !== "AGENT") {
      return {
        ok: false,
        status: 400,
        message: "Tasks can only be assigned to a developer.",
      };
    }
  }

  if (patch.deadline !== undefined) {
    const problem = await taskDeadlineProblem(task.projectId, patch.deadline);
    if (problem) return { ok: false, status: 400, message: problem };
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of Object.keys(COLUMN) as (keyof typeof COLUMN)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    values.push(key === "links" ? JSON.stringify(value) : value);
    sets.push(`${COLUMN[key]} = $${values.length}`);
  }
  if (sets.length === 0) return { ok: true, task };
  values.push(user.id);
  sets.push(`updated_by = $${values.length}`, "updated_at = now()");
  values.push(id);
  await query(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${values.length}`,
    values,
  );

  const updated = await getTaskById(user, id);
  return updated
    ? { ok: true, task: updated }
    : { ok: false, status: 404, message: "Task not found." };
}

type CommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  author_role: SessionUser["role"];
  body: string;
  created_at: Date;
};

function toComment(r: CommentRow): TaskComment {
  return {
    id: r.id,
    taskId: r.task_id,
    authorId: r.author_id,
    authorName: r.author_name,
    authorRole: r.author_role,
    body: r.body,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

/** The task's thread, or null when the task is not visible to this user. */
export async function getComments(
  user: SessionUser,
  taskId: string,
): Promise<TaskComment[] | null> {
  if (!(await getTaskById(user, taskId))) return null;
  const rows = await query<CommentRow>(
    `SELECT c.id, c.task_id, c.author_id, u.name AS author_name, u.role AS author_role,
            c.body, c.created_at
       FROM task_comments c JOIN users u ON u.id = c.author_id
      WHERE c.task_id = $1
      ORDER BY c.created_at`,
    [taskId],
  );
  return rows.map(toComment);
}

/** Adds a comment as this user. Null when the task is not visible. */
export async function addComment(
  user: SessionUser,
  taskId: string,
  body: string,
): Promise<TaskComment | null> {
  const task = await getTaskById(user, taskId);
  if (!task?.canUpdate) return null;
  const id = randomUUID();
  await query(
    "INSERT INTO task_comments (id, task_id, author_id, body) VALUES ($1,$2,$3,$4)",
    [id, taskId, user.id, body],
  );
  return {
    id,
    taskId,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    body,
    createdAt: new Date().toISOString(),
  };
}

type MeetingRow = {
  id: string;
  created_at: Date;
  created_by_name: string;
  title: string;
  category: string;
  summary: string;
  open_questions: string[] | null;
  agenda: AgendaItem[] | null;
  project_ids: string[];
  saved: boolean;
};

/** Saved transcript analyses: admins see all, managers see meetings that created their projects. */
export async function getMeetings(
  user: SessionUser,
  limit = 10,
): Promise<Meeting[]> {
  if (user.role === "AGENT") return [];
  const where =
    user.role === "ADMIN"
      ? "$1::text IS NOT NULL"
      : "EXISTS (SELECT 1 FROM projects p WHERE p.id = ANY(mt.project_ids) AND p.manager_id = $1)";
  const rows = await query<MeetingRow>(
    `SELECT mt.id, mt.created_at, u.name AS created_by_name, mt.title, mt.category,
            mt.summary, mt.open_questions, mt.agenda, mt.project_ids, mt.saved
       FROM meetings mt JOIN users u ON u.id = mt.created_by
      WHERE ${where}
      ORDER BY mt.created_at DESC
      LIMIT $2`,
    [user.id, limit],
  );
  return rows.map((r) => ({
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    createdByName: r.created_by_name,
    title: r.title,
    category: r.category,
    summary: r.summary,
    openQuestions: r.open_questions ?? [],
    agenda: r.agenda ?? [],
    projectIds: r.project_ids,
    saved: r.saved,
  }));
}

// ---- Project and task management (admin, or the project's own manager) ----

export type MutationOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 403 | 404; message: string };

function isRealDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** A task may not be due after its project. Returns a message, or null when fine. */
async function taskDeadlineProblem(
  projectId: string,
  deadline: string,
): Promise<string | null> {
  if (!isRealDate(deadline)) return `"${deadline}" is not a valid date.`;
  const [p] = await query<{ deadline: string }>(
    "SELECT deadline FROM projects WHERE id = $1",
    [projectId],
  );
  if (p && deadline > p.deadline) {
    return `The task deadline cannot be after the project deadline (${p.deadline}).`;
  }
  return null;
}

async function hasRole(
  id: string,
  role: SessionUser["role"],
): Promise<boolean> {
  const [u] = await query<{ role: string }>(
    "SELECT role FROM users WHERE id = $1",
    [id],
  );
  return u?.role === role;
}

/** Visible + editable project, or the right error (404 hides existence). */
async function editableProject(
  user: SessionUser,
  id: string,
): Promise<MutationOutcome<Project>> {
  const [project] = await queryProjects(user, id);
  if (!project)
    return { ok: false, status: 404, message: "Project not found." };
  if (!project.canEdit) {
    return {
      ok: false,
      status: 403,
      message: "Only an admin or this project's manager can change it.",
    };
  }
  return { ok: true, value: project };
}

const PROJECT_COLUMN: Record<keyof z.infer<typeof ProjectPatch>, string> = {
  name: "name",
  clientName: "client_name",
  description: "description",
  deadline: "deadline",
  managerId: "manager_id",
};

/** Edits project details. Only admins may reassign the manager. */
export async function updateProject(
  user: SessionUser,
  id: string,
  patch: z.infer<typeof ProjectPatch>,
): Promise<MutationOutcome<Project>> {
  const found = await editableProject(user, id);
  if (!found.ok) return found;
  const project = found.value;

  if (patch.managerId !== undefined && patch.managerId !== project.managerId) {
    if (!project.canReassign) {
      return {
        ok: false,
        status: 403,
        message: "Only an admin can change the project manager.",
      };
    }
    if (!(await hasRole(patch.managerId, "MANAGER"))) {
      return {
        ok: false,
        status: 400,
        message: "Choose a project manager from the team.",
      };
    }
  }
  if (patch.deadline !== undefined) {
    if (!isRealDate(patch.deadline)) {
      return {
        ok: false,
        status: 400,
        message: `"${patch.deadline}" is not a valid date.`,
      };
    }
    const [latest] = await query<{ deadline: string | null }>(
      "SELECT max(deadline) AS deadline FROM tasks WHERE project_id = $1",
      [id],
    );
    if (latest?.deadline && patch.deadline < latest.deadline) {
      return {
        ok: false,
        status: 400,
        message: `The project deadline cannot be before its latest task deadline (${latest.deadline}). Move those tasks first.`,
      };
    }
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of Object.keys(
    PROJECT_COLUMN,
  ) as (keyof typeof PROJECT_COLUMN)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    values.push(value);
    sets.push(`${PROJECT_COLUMN[key]} = $${values.length}`);
  }
  if (sets.length > 0) {
    values.push(id);
    await query(
      `UPDATE projects SET ${sets.join(", ")} WHERE id = $${values.length}`,
      values,
    );
  }
  // Only admins reassign, and they see every project, so the editor can re-read it.
  const [updated] = await queryProjects(user, id);
  return updated
    ? { ok: true, value: updated }
    : { ok: false, status: 404, message: "Project not found." };
}

/** Deletes a project with all its tasks and their discussions. */
export async function deleteProject(
  user: SessionUser,
  id: string,
): Promise<MutationOutcome<{ id: string }>> {
  const found = await editableProject(user, id);
  if (!found.ok) return found;
  await query("DELETE FROM projects WHERE id = $1", [id]);
  return { ok: true, value: { id } };
}

/** Adds a task to a project the user manages. */
export async function createTask(
  user: SessionUser,
  projectId: string,
  data: z.infer<typeof TaskCreate>,
): Promise<MutationOutcome<BoardTask>> {
  const found = await editableProject(user, projectId);
  if (!found.ok) return found;
  if (!(await hasRole(data.assigneeId, "AGENT"))) {
    return {
      ok: false,
      status: 400,
      message: "Tasks can only be assigned to a developer.",
    };
  }
  const problem = await taskDeadlineProblem(projectId, data.deadline);
  if (problem) return { ok: false, status: 400, message: problem };

  const id = randomUUID();
  await query(
    `INSERT INTO tasks (id, project_id, title, description, assignee_id, deadline,
                        estimated_hours, reported_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
    [
      id,
      projectId,
      data.title,
      data.description,
      data.assigneeId,
      data.deadline,
      data.estimatedHours,
      user.id,
    ],
  );
  const task = await getTaskById(user, id);
  return task
    ? { ok: true, value: task }
    : { ok: false, status: 404, message: "Task not found." };
}

/** Deletes a task (and its discussion). Admin or the project's manager only. */
export async function deleteTask(
  user: SessionUser,
  id: string,
): Promise<MutationOutcome<{ id: string; projectId: string }>> {
  const task = await getTaskById(user, id);
  if (!task) return { ok: false, status: 404, message: "Task not found." };
  if (!task.canEdit) {
    return {
      ok: false,
      status: 403,
      message: "Only an admin or this project's manager can delete tasks.",
    };
  }
  await query("DELETE FROM tasks WHERE id = $1", [id]);
  return { ok: true, value: { id, projectId: task.projectId } };
}
