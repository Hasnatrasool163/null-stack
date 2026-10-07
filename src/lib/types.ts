export type Role = "ADMIN" | "MANAGER" | "AGENT";

/** The authenticated user, always loaded from the DB (never from the client). */
export type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

/** Public team directory entry. Never contains email or credentials. */
export type TeamMember = {
  id: string;
  name: string;
  role: Role;
  specialization: string;
  skills: string[];
};

export type Project = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  managerName: string;
  /** YYYY-MM-DD */
  deadline: string;
  /** Number of tasks this particular user is allowed to see. */
  taskCount: number;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  /** YYYY-MM-DD */
  deadline: string;
  estimatedHours: number;
};

export type ProjectDetail = { project: Project; tasks: Task[] };

/** A task shown on /my-tasks, with its project context. */
export type MyTask = Task & {
  projectName: string;
  managerName: string;
};

export type DraftError = { where: string; message: string };

export type CreatedProject = { id: string; name: string; taskCount: number };

export type TranscriptResult =
  | { ok: true; projects: CreatedProject[] }
  | { ok: false; errors: DraftError[] };
