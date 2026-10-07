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

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskLink = { label: string; url: string };

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
  status: TaskStatus;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
  reportedByName: string | null;
  updatedByName: string | null;
  links: TaskLink[];
  commentCount: number;
};

/** A task on the Kanban board, with project context and what this user may do. */
export type BoardTask = Task & {
  projectName: string;
  managerId: string;
  managerName: string;
  /** Can edit title, description, assignee, deadline, hours. */
  canEdit: boolean;
  /** Can move status, add links and comment. */
  canUpdate: boolean;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  /** ISO timestamp */
  createdAt: string;
};

export type ProjectDetail = { project: Project; tasks: Task[] };

/** A task shown on /my-tasks, with its project context. */
export type MyTask = Task & {
  projectName: string;
  managerName: string;
};

export type DraftError = { where: string; message: string };

export type CreatedTask = {
  title: string;
  description: string;
  assigneeName: string;
  deadline: string;
  estimatedHours: number;
};

export type CreatedProject = {
  id: string;
  name: string;
  taskCount: number;
  clientName: string;
  managerName: string;
  deadline: string;
  tasks: CreatedTask[];
};

export type AgendaKind = "OPEN_QUESTION" | "UNRESOLVED" | "FOLLOW_UP" | "RISK" | "DECISION";

export type AgendaItem = {
  topic: string;
  reason: string;
  kind: AgendaKind;
  suggestedOwner: string | null;
};

/** What the AI learned about the meeting, shown even when nothing was saved. */
export type MeetingInsights = {
  title: string;
  category: string;
  summary: string;
  openQuestions: string[];
  agenda: AgendaItem[];
};

export type Meeting = MeetingInsights & {
  id: string;
  createdAt: string;
  createdByName: string;
  saved: boolean;
  projectIds: string[];
};

export type TranscriptResult =
  | { ok: true; projects: CreatedProject[]; insights: MeetingInsights; meetingId: string }
  | {
      ok: false;
      reason: "NOT_RELEVANT" | "INVALID" | "ERROR";
      errors: DraftError[];
      insights?: MeetingInsights;
    };
