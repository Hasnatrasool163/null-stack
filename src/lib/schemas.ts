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
export const Draft = z.object({
  projects: z.array(DraftProject),
  unresolved: z
    .array(z.object({ path: z.string(), reason: z.string() }))
    .default([]),
});
export type Draft = z.infer<typeof Draft>;
