import { z } from "zod";

// Define request/response shapes ONCE and share them between UI and API routes.
export const MAX_TRANSCRIPT_CHARS = 30_000;

export const LoginRequest = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export const TranscriptRequest = z.object({
  transcript: z.string().max(MAX_TRANSCRIPT_CHARS),
});

export const DraftTask = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  assigneeId: z.string().nullable(),
  deadline: z.string().nullable(),
  estimatedHours: z.number().nullable(),
});
export const DraftProject = z.object({
  name: z.string().nullable(),
  clientName: z.string().nullable(),
  description: z.string().nullable(),
  managerId: z.string().nullable(),
  deadline: z.string().nullable(),
  tasks: z.array(DraftTask),
});
const AGENDA_KINDS = ["OPEN_QUESTION", "UNRESOLVED", "FOLLOW_UP", "RISK", "DECISION"] as const;

export const DraftAgendaItem = z.object({
  topic: z.string(),
  reason: z.string().default(""),
  // Models sometimes invent a kind; fall back instead of failing the whole draft.
  kind: z.enum(AGENDA_KINDS).catch("FOLLOW_UP"),
  suggestedOwner: z.string().nullable().default(null),
});

export const Draft = z.object({
  relevance: z
    .object({
      isRelevant: z.boolean(),
      category: z.string().default(""),
      reason: z.string().default(""),
    })
    .default({ isRelevant: true, category: "", reason: "" }),
  meeting: z
    .object({
      title: z.string().default(""),
      summary: z.string().default(""),
      openQuestions: z.array(z.string()).default([]),
      agenda: z.array(DraftAgendaItem).default([]),
    })
    .default({ title: "", summary: "", openQuestions: [], agenda: [] }),
  projects: z.array(DraftProject).default([]),
  unresolved: z
    .array(z.object({ path: z.string(), reason: z.string() }))
    .default([]),
});
export type Draft = z.infer<typeof Draft>;

// ---- Kanban ----
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);

export const TaskLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed"),
});

/** Every field optional: the server applies only what this user may change. */
export const TaskPatch = z
  .object({
    status: TaskStatusSchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4000),
    assigneeId: z.string().trim().min(1).max(40),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estimatedHours: z.number().positive().max(1000),
    links: z.array(TaskLinkSchema).max(20),
  })
  .partial()
  .strict();

export const CommentRequest = z.object({
  body: z.string().trim().min(1).max(2000),
});
