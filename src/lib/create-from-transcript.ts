import { randomUUID } from "node:crypto";
import { structured, type ChatMessage } from "@/lib/llm";
import { query, withTransaction } from "@/lib/db";
import { todayYmd } from "@/lib/format";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompts";
import { Draft, MAX_TRANSCRIPT_CHARS } from "@/lib/schemas";
import type {
  CreatedProject,
  DraftError,
  MeetingInsights,
  Role,
  SessionUser,
  TeamMember,
} from "@/lib/types";

export type CreateOutcome =
  | {
      ok: true;
      projects: CreatedProject[];
      insights: MeetingInsights;
      meetingId: string;
    }
  | {
      ok: false;
      status: 400 | 403 | 409 | 422 | 502;
      reason: "NOT_RELEVANT" | "INVALID" | "ERROR";
      errors: DraftError[];
      insights?: MeetingInsights;
    };

const globalForLock = globalThis as unknown as { __creating?: boolean };

const fail = (
  status: 400 | 403 | 409 | 422 | 502,
  where: string,
  message: string,
): CreateOutcome => ({
  ok: false,
  status,
  reason: "ERROR",
  errors: [{ where, message }],
});

function toInsights(draft: Draft): MeetingInsights {
  const m = draft.meeting;
  return {
    title: m.title.trim() || "Untitled meeting",
    category: draft.relevance.category.trim(),
    summary: m.summary.trim(),
    openQuestions: m.openQuestions.map((q) => q.trim()).filter(Boolean),
    agenda: m.agenda
      .filter((a) => a.topic.trim())
      .map((a) => ({
        topic: a.topic.trim(),
        reason: a.reason.trim(),
        kind: a.kind,
        suggestedOwner: a.suggestedOwner?.trim() || null,
      })),
  };
}

function isRealDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const blank = (v: string | null): boolean => !v || !v.trim();

/** Collects ALL problems in the draft; an empty array means it is safe to save. */
export function validateDraft(
  draft: Draft,
  roles: Map<string, Role>,
): DraftError[] {
  const errors: DraftError[] = [];
  if (draft.projects.length === 0) {
    errors.push({
      where: "Transcript",
      message:
        "No agreed projects or tasks were found. Make sure the transcript names the client, the work, an owner, a deadline and estimated hours.",
    });
  }
  for (const u of draft.unresolved) {
    errors.push({
      where: u.path || "Transcript",
      message: `The AI could not determine: ${u.reason}`,
    });
  }
  draft.projects.forEach((p, i) => {
    const label = p.name?.trim() || `Project ${i + 1}`;
    if (blank(p.name)) {
      errors.push({ where: label, message: "Project name is missing." });
    }
    if (blank(p.clientName)) {
      errors.push({ where: label, message: "Client name is missing." });
    }
    if (blank(p.managerId)) {
      errors.push({ where: label, message: "Project manager is missing." });
    } else if (roles.get(p.managerId!) !== "MANAGER") {
      errors.push({
        where: label,
        message: `"${p.managerId}" is not a project manager in the team directory.`,
      });
    }
    if (p.deadline === null) {
      errors.push({ where: label, message: "Project deadline is missing." });
    } else if (!isRealDate(p.deadline)) {
      errors.push({
        where: label,
        message: `Project deadline "${p.deadline}" is not a valid YYYY-MM-DD date.`,
      });
    }
    if (p.tasks.length === 0) {
      errors.push({ where: label, message: "Project has no tasks." });
    }
    p.tasks.forEach((t, j) => {
      const tl = `${label} / ${t.title?.trim() || `Task ${j + 1}`}`;
      if (blank(t.title)) {
        errors.push({ where: tl, message: "Task title is missing." });
      }
      if (blank(t.assigneeId)) {
        errors.push({ where: tl, message: "Task owner is missing." });
      } else if (roles.get(t.assigneeId!) !== "AGENT") {
        errors.push({
          where: tl,
          message: `"${t.assigneeId}" is not a developer in the team directory.`,
        });
      }
      if (
        t.estimatedHours === null ||
        !Number.isFinite(t.estimatedHours) ||
        t.estimatedHours <= 0
      ) {
        errors.push({
          where: tl,
          message: "Estimated hours must be a number greater than 0.",
        });
      }
      if (t.deadline === null) {
        errors.push({ where: tl, message: "Task deadline is missing." });
      } else if (!isRealDate(t.deadline)) {
        errors.push({
          where: tl,
          message: `Task deadline "${t.deadline}" is not a valid YYYY-MM-DD date.`,
        });
      } else if (isRealDate(p.deadline) && t.deadline > p.deadline) {
        errors.push({
          where: tl,
          message: `Task deadline ${t.deadline} is after the project deadline ${p.deadline}.`,
        });
      }
    });
  });
  return errors;
}

async function loadDirectory(): Promise<TeamMember[]> {
  return query<TeamMember>(
    "SELECT id, name, role, specialization, skills FROM users ORDER BY id",
  );
}

async function saveDraft(
  draft: Draft,
  insights: MeetingInsights,
  user: SessionUser,
  names: Map<string, string>,
): Promise<{ projects: CreatedProject[]; meetingId: string }> {
  return withTransaction(async (client) => {
    const created: CreatedProject[] = [];
    for (const p of draft.projects) {
      const projectId = randomUUID();
      await client.query(
        `INSERT INTO projects (id, name, client_name, description, manager_id, deadline)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          projectId,
          p.name!.trim(),
          p.clientName!.trim(),
          p.description?.trim() ?? "",
          p.managerId,
          p.deadline,
        ],
      );
      for (const t of p.tasks) {
        await client.query(
          `INSERT INTO tasks (id, project_id, title, description, assignee_id, deadline,
                              estimated_hours, reported_by, updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
          [
            randomUUID(),
            projectId,
            t.title!.trim(),
            t.description?.trim() ?? "",
            t.assigneeId,
            t.deadline,
            t.estimatedHours,
            user.id,
          ],
        );
      }
      created.push({
        id: projectId,
        name: p.name!.trim(),
        taskCount: p.tasks.length,
        clientName: p.clientName!.trim(),
        managerName: names.get(p.managerId!) ?? p.managerId!,
        deadline: p.deadline!,
        tasks: p.tasks.map((t) => ({
          title: t.title!.trim(),
          description: t.description?.trim() ?? "",
          assigneeName: names.get(t.assigneeId!) ?? t.assigneeId!,
          deadline: t.deadline!,
          estimatedHours: t.estimatedHours!,
        })),
      });
    }
    const meetingId = randomUUID();
    await client.query(
      `INSERT INTO meetings (id, created_by, title, category, summary, open_questions, agenda, project_ids, saved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
      [
        meetingId,
        user.id,
        insights.title,
        insights.category,
        insights.summary,
        JSON.stringify(insights.openQuestions),
        JSON.stringify(insights.agenda),
        created.map((c) => c.id),
      ],
    );
    return { projects: created, meetingId };
  });
}

const AI_OPTIONS = {
  temperature: 0,
  maxTokens: 6000,
  timeoutMs: 40_000,
  cache: false,
};

export async function createFromTranscript(
  user: SessionUser,
  transcript: string,
): Promise<CreateOutcome> {
  if (user.role !== "ADMIN") {
    return fail(
      403,
      "Access",
      "Only admins can create projects from a transcript.",
    );
  }
  if (!transcript.trim()) {
    return fail(400, "Transcript", "Paste a meeting transcript first.");
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return fail(
      400,
      "Transcript",
      `The transcript is too long (maximum ${MAX_TRANSCRIPT_CHARS.toLocaleString("en-US")} characters).`,
    );
  }
  if (globalForLock.__creating) {
    return fail(
      409,
      "Busy",
      "A creation is already running. Please wait for it to finish.",
    );
  }
  globalForLock.__creating = true;
  try {
    const directory = await loadDirectory();
    const roles = new Map(directory.map((u) => [u.id, u.role]));
    const names = new Map(directory.map((u) => [u.id, u.name]));
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(directory, todayYmd(), transcript),
      },
    ];

    let draft: Draft;
    let errors: DraftError[];
    try {
      draft = await structured(Draft, messages, AI_OPTIONS);
      if (!draft.relevance.isRelevant) {
        return {
          ok: false,
          status: 422,
          reason: "NOT_RELEVANT",
          errors: [
            {
              where: draft.relevance.category.trim() || "Transcript",
              message:
                draft.relevance.reason.trim() ||
                "This meeting does not discuss software, IT or technical work, so no tasks were created.",
            },
          ],
          insights: toInsights(draft),
        };
      }
      errors = validateDraft(draft, roles);
      if (errors.length > 0) {
        // One automatic repair attempt: feed the validation errors back once.
        const issues = errors
          .map((e) => `- ${e.where}: ${e.message}`)
          .join("\n");
        draft = await structured(
          Draft,
          [
            ...messages,
            { role: "assistant", content: JSON.stringify(draft) },
            {
              role: "user",
              content: `Your JSON failed validation:\n${issues}\nReturn the corrected JSON only. Fix an item only if the transcript clearly supports it. Never invent people, dates or hours: otherwise set the value to null and list it in "unresolved".`,
            },
          ],
          AI_OPTIONS,
        );
        errors = validateDraft(draft, roles);
      }
    } catch {
      return fail(
        502,
        "AI",
        "The AI service could not process the transcript right now. Nothing was saved. Please try again.",
      );
    }

    const insights = toInsights(draft);
    if (errors.length > 0) {
      return { ok: false, status: 422, reason: "INVALID", errors, insights };
    }
    try {
      const saved = await saveDraft(draft, insights, user, names);
      return { ok: true, insights, ...saved };
    } catch {
      return fail(
        502,
        "Database",
        "Saving failed, so nothing was created. Please try again.",
      );
    }
  } finally {
    globalForLock.__creating = false;
  }
}
