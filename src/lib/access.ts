import { query } from "@/lib/db";
import type {
  MyTask,
  Project,
  ProjectDetail,
  SessionUser,
  Task,
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

function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    clientName: r.client_name,
    description: r.description,
    managerId: r.manager_id,
    managerName: r.manager_name,
    deadline: r.deadline,
    taskCount: r.task_count,
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
  return rows.map(toProject);
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
};

function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_name,
    deadline: r.deadline,
    estimatedHours: r.estimated_hours,
  };
}

const TASK_COLUMNS = `t.id, t.project_id, t.title, t.description, t.assignee_id,
       a.name AS assignee_name, t.deadline, t.estimated_hours`;

/** Tasks of one project that this user may see. */
export async function getTasks(
  user: SessionUser,
  projectId: string,
): Promise<Task[]> {
  let rows: TaskRow[];
  switch (user.role) {
    case "ADMIN":
      rows = await query<TaskRow>(
        `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users a ON a.id = t.assignee_id
          WHERE t.project_id = $1 ORDER BY t.deadline, t.title`,
        [projectId],
      );
      break;
    case "MANAGER":
      rows = await query<TaskRow>(
        `SELECT ${TASK_COLUMNS} FROM tasks t
           JOIN users a ON a.id = t.assignee_id
           JOIN projects p ON p.id = t.project_id
          WHERE t.project_id = $1 AND p.manager_id = $2
          ORDER BY t.deadline, t.title`,
        [projectId, user.id],
      );
      break;
    case "AGENT":
      rows = await query<TaskRow>(
        `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users a ON a.id = t.assignee_id
          WHERE t.project_id = $1 AND t.assignee_id = $2
          ORDER BY t.deadline, t.title`,
        [projectId, user.id],
      );
      break;
  }
  return rows.map(toTask);
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

/**
 * Every task this user may see, across all visible projects, in one query
 * (same rules as getTasks). Used for dashboard totals.
 */
export async function getVisibleTasks(user: SessionUser): Promise<Task[]> {
  const scope: Record<SessionUser["role"], { where: string; params: unknown[] }> = {
    ADMIN: { where: "TRUE", params: [] },
    MANAGER: { where: "p.manager_id = $1", params: [user.id] },
    AGENT: { where: "t.assignee_id = $1", params: [user.id] },
  };
  const { where, params } = scope[user.role];
  const rows = await query<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks t
       JOIN users a ON a.id = t.assignee_id
       JOIN projects p ON p.id = t.project_id
      WHERE ${where}
      ORDER BY t.deadline, t.title`,
    params,
  );
  return rows.map(toTask);
}

/** The signed-in user's own assigned tasks, with project context. */
export async function getMyTasks(user: SessionUser): Promise<MyTask[]> {
  const rows = await query<
    TaskRow & { project_name: string; manager_name: string }
  >(
    `SELECT ${TASK_COLUMNS}, p.name AS project_name, m.name AS manager_name
       FROM tasks t
       JOIN users a ON a.id = t.assignee_id
       JOIN projects p ON p.id = t.project_id
       JOIN users m ON m.id = p.manager_id
      WHERE t.assignee_id = $1
      ORDER BY p.name, t.deadline, t.title`,
    [user.id],
  );
  return rows.map((r) => ({
    ...toTask(r),
    projectName: r.project_name,
    managerName: r.manager_name,
  }));
}
