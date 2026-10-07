# ROLE
You are a senior full-stack engineer building a hackathon MVP with me in a strict 3-hour time box. Priority order: WORKING end-to-end core flow > correctness of access control > clear UI > polish. Never trade a working demo for extra scope.

# PROJECT
Name: {{PROJECT_NAME}}   Team: {{TEAM_NAME}}
Pitch: A simple Project Management CRM for the fictional company NovaWorks Technologies. An admin pastes a meeting transcript, AI converts it into projects and tasks (with the right manager/developer, deadlines and estimated hours), and role-based views show each user only what they may see.
Core flow: Login -> Admin pastes transcript -> "Create from Transcript" -> AI creates projects + tasks (saved atomically) -> view saved projects and assigned tasks by role.
Judges grade: working meeting-to-project flow, role-based access enforced on the SERVER, persistence, clear frontend, genuine AI (a modified transcript must change the output), README, and deployment bonus (live app + hosted DB).
I am Person {{A or B}}. I own: {{A = UI/pages/states/README/video | B = DB/auth/access layer/AI flow/deploy}}. Shared contract: `src/lib/types.ts` + `src/lib/schemas.ts` (tell me before changing).

# TIME BOX
Total 3h. Hard feature freeze at T+2:30. Deployment must be working by T+2:00 (not at the end).
Mandatory order: (1) DB + seed + login, (2) access-controlled lists/detail pages with manually inserted test rows, (3) AI transcript flow, (4) states/polish, (5) deploy, verify, README, video.

# STARTING POINT (already in repo; reuse, do not rebuild)
Next.js App Router + TypeScript + Tailwind v4 + `src/components/ui/*` (Button, Card, Input, Textarea, Label, Spinner, Skeleton, Badge, sonner toasts via Providers).
- `src/lib/llm.ts`: `chat()` and `structured(zodSchema, messages)` with provider fallback. ALL LLM calls go through it.
- Remove from the home page and stop using: the JSON-file `src/lib/db.ts`, `supabase.ts`, `ai-playground`, `places-demo`, `map-view`, `chart-example`, `data/seed.json`. (Vercel's filesystem is read-only, so the JSON db cannot be used. Delete these files in the cleanup step if time allows.)
- Allowed NEW dependencies (nothing else): `pg`, `bcryptjs`, `jose`, `@types/pg`. Do not upgrade packages. Do not add an ORM.
- This is a very recent Next.js: `cookies()` and route/page `params` are async (`await`). If unsure of any API, read `node_modules/next/dist/docs/`. Do NOT use middleware/proxy files for auth; check the session inside server code.

# STACK DECISIONS (final, do not re-debate)
- DB: PostgreSQL via `pg` with raw SQL and parameterized queries. Same `DATABASE_URL` for local and deployed (hosted Aiven free PostgreSQL). Create a single shared Pool on `globalThis` (max 3 connections) so serverless reloads do not exhaust connections.
  - SSL: Aiven requires TLS. Strip any `sslmode=` from the URL and pass `ssl: { rejectUnauthorized: false }` to the Pool.
  - Date/number gotchas: call `types.setTypeParser(1082, v => v)` so DATE columns stay `'YYYY-MM-DD'` strings (no timezone shifting), and parse NUMERIC (1700) to float. Never use `new Date()` to display deadlines; format the string.
- Auth: email + password. `bcryptjs` compare. Session = signed JWT (`jose`, HS256, `SESSION_SECRET`) in an httpOnly, sameSite=lax cookie (`secure` in production), 8h expiry. `getCurrentUser()` reads the cookie, verifies, then loads the user from the DB (so role/id never come from the client). Login/logout = route handlers `/api/auth/login`, `/api/auth/logout`.
- Reads: Server Components call the access functions directly. Also expose `GET /api/projects` and `GET /api/projects/[id]` using the SAME functions (so judges can test direct requests).
- AI: `structured()` from `src/lib/llm.ts`, temperature 0, `cache` OFF, `maxTokens` 4000 (the starter default of 1500 will truncate 12 tasks), `timeoutMs` ~40000. Provider order for this project: `LLM_PROVIDER_ORDER=gemini,groq,openrouter` (long input; OpenRouter free = 50 requests/day, avoid for testing).
- IDs: users use the supplied reference IDs as primary keys: `ADMIN, PM01, PM02, PM03, DEV01..DEV06` (text), so the AI directory and saved assignments use the same ids. Projects/tasks get app-generated ids (`crypto.randomUUID()`), never model-generated.

# DATABASE (create via `scripts/db-setup.mjs`, idempotent; run with `node --env-file=.env.local`)
```sql
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL,
  password_hash text NOT NULL, role text NOT NULL CHECK (role IN ('ADMIN','MANAGER','AGENT')),
  specialization text NOT NULL DEFAULT '', skills text[] NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY, name text NOT NULL, client_name text NOT NULL, description text NOT NULL DEFAULT '',
  manager_id text NOT NULL REFERENCES users(id), deadline date NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL, description text NOT NULL DEFAULT '', assignee_id text NOT NULL REFERENCES users(id),
  deadline date NOT NULL, estimated_hours numeric NOT NULL CHECK (estimated_hours > 0));
CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);
```
Scripts (add to package.json; all use `node --env-file=.env.local`):
- `db:setup` creates tables. `db:seed` upserts the 10 users `ON CONFLICT (email) DO UPDATE` (re-running never duplicates), hashing `Demo123!` with bcrypt. `db:reset-work` deletes ALL tasks then projects but keeps users (for resetting between judge tests). `verify` = see Acceptance Check.

## The 10 demo users (seed exactly; password `Demo123!` for all)
| id | name | email | role | specialization | skills |
|---|---|---|---|---|---|
| ADMIN | Admin | admin@novaworks.example | ADMIN | Administrator | Company overview, transcript creation |
| PM01 | Ayesha Khan | ayesha@novaworks.example | MANAGER | Web PM | Web projects, client coordination |
| PM02 | Bilal Ahmed | bilal@novaworks.example | MANAGER | Mobile PM | Mobile projects, delivery planning |
| PM03 | Hina Malik | hina@novaworks.example | MANAGER | AI PM | AI projects, requirement review |
| DEV01 | Ali Raza | ali@novaworks.example | AGENT | Full-Stack | React, frontend integration |
| DEV02 | Hamza Shah | hamza@novaworks.example | AGENT | Full-Stack | Node.js, databases, APIs |
| DEV03 | Sara Noor | sara@novaworks.example | AGENT | App Developer | Flutter, mobile UI |
| DEV04 | Usman Tariq | usman@novaworks.example | AGENT | App Developer | Flutter, integration, testing |
| DEV05 | Zain Abbas | zain@novaworks.example | AGENT | AI Developer | LLMs, extraction, prompts |
| DEV06 | Maryam Asif | maryam@novaworks.example | AGENT | AI Developer | Retrieval, document processing |

# FUNCTIONAL REQUIREMENTS
P0 (build first; each must work in the browser in under 60s with no explanation):
1. Login/logout with the demo accounts; invalid credentials show a clear error. After login: ADMIN and MANAGER -> `/projects`; AGENT -> `/my-tasks`. Unauthenticated access to any page redirects to `/login`.
2. Shared nav (role-aware): Projects, My Tasks (agents only), Team, Create from Transcript (admin only), Logout; show current user name + role.
3. Access-controlled data layer in `src/lib/access.ts` (the ONLY place that queries projects/tasks):
   - `getProjects(user)`: ADMIN all; MANAGER `manager_id = user.id`; AGENT distinct projects containing tasks assigned to them.
   - `getTasks(user, projectId)`: ADMIN all tasks; MANAGER all tasks only if they manage that project; AGENT only tasks with `assignee_id = user.id` in that project.
   - `getProjectById(user, id)`: returns null unless the project is in `getProjects(user)`, else project + `getTasks(...)`. Pages/API return 404 (not 403) when null, so existence is not leaked.
   - Never trust a client-supplied user id or role. An agent may see the related project name, client and manager, but NEVER other agents' tasks.
4. Projects list (cards: name, client, manager, deadline, task count visible to this user) and project detail (client, manager, deadline, description, task table: title, description, assigned agent, deadline, estimated hours).
5. `/my-tasks` for agents: their tasks grouped by project, each showing project name, manager, title, description, deadline, hours. Hamza must show two tasks across two projects.
6. Read-only `/team` directory: name, role, specialization, skills (no emails/passwords). Visible to all logged-in users.
7. Admin-only `/admin/transcript` (route handler also enforces ADMIN, returns 403 otherwise): large textarea, a "Load sample transcript" button that fills the textarea from `src/data/transcript.txt` (provided file; it only prefills the INPUT, never the output), and a "Create from Transcript" button. See the transcript flow below.
8. Persistence: everything saved in Postgres; a refresh keeps projects/tasks.

P1 (only after every P0 works): one automatic AI repair retry on business-rule failure (feed the validation errors back, once); `GET /api/projects` and `/api/projects/[id]` JSON endpoints; empty-state copy; `db:reset-work` script wired up and documented.
P2 (skip by default): editing projects/tasks, preview-before-save step, "Reset demo data" button, charts.
OUT OF SCOPE (do not build): signup, forgot password, email verification, user-management screens, cost/rate/budget fields, progress or completion tracking, charts, timesheets, notifications, file uploads, dark mode, i18n, tests beyond the verify script.

# TRANSCRIPT FLOW: `createFromTranscript(user, transcript)` in `src/lib/create-from-transcript.ts`, called by `POST /api/transcript`
1. Reject unless `user.role === 'ADMIN'` (403). Reject empty/whitespace transcript (400) and transcripts over ~30,000 chars.
2. In-flight lock: if a creation is already running for this process, return 409. UI disables the button and shows a spinner + "Analyzing meeting..." while waiting (can take 10-40s).
3. Directory sent to the AI = `{id, name, role, specialization, skills}` for the 10 users. NEVER send passwords, hashes or emails.
4. Call `structured(DraftSchema, messages)` (temperature 0, maxTokens 4000). Input = full transcript (use the entire transcript) + directory + the system prompt below.
5. Validate the complete draft in code BEFORE saving anything (collect ALL errors, don't stop at the first):
   - each project: non-empty name, clientName, `managerId` exists and role is MANAGER, `deadline` a real `YYYY-MM-DD` date;
   - each task: non-empty title, `assigneeId` exists and role is AGENT, `estimatedHours` a finite number > 0, `deadline` a real date and `<= project deadline`;
   - any `null` required field or non-empty `unresolved` array = error;
   - zero projects = error ("No projects found in the transcript").
6. If any error: save NOTHING; return `{ok:false, errors:[{where, message}]}`. The UI lists each unresolved problem in plain language and keeps the textarea content so the admin can edit the transcript and resubmit (this is the "correction" path). Never invent a person to make validation pass.
7. If valid: save all projects and tasks inside ONE `BEGIN ... COMMIT` transaction (`ROLLBACK` on any error), generating ids in app code. Return `{ok:true, projects:[{id,name,taskCount}]}`.
8. UI success state: "Created N projects and M tasks" with links to each project. Error state: readable message, never a stack trace. AI failure/invalid JSON = friendly error and nothing saved.
9. Do NOT hardcode, prefill, or fall back to a canned result anywhere. The output must come from the model. If the model is unavailable, show the error.

## Zod draft schema (`src/lib/schemas.ts`)
```ts
export const DraftTask = z.object({
  title: z.string().nullable(), description: z.string().nullable(),
  assigneeId: z.string().nullable(), deadline: z.string().nullable(),
  estimatedHours: z.number().nullable(),
});
export const DraftProject = z.object({
  name: z.string().nullable(), clientName: z.string().nullable(), description: z.string().nullable(),
  managerId: z.string().nullable(), deadline: z.string().nullable(), tasks: z.array(DraftTask),
});
export const Draft = z.object({
  projects: z.array(DraftProject),
  unresolved: z.array(z.object({ path: z.string(), reason: z.string() })).default([]),
});
```
(Nullable fields let the model say "unknown" instead of guessing; code then reports them as unresolved.)

## System prompt (store in `src/lib/prompts.ts`; keep it GENERIC, no transcript-specific answers inside it)
```
You convert a meeting transcript into project-management records for a software company.
You receive: (1) a team directory of existing users with ids, roles and skills, (2) the full transcript.
Return ONLY one JSON object, no prose, in this shape:
{"projects":[{"name","clientName","description","managerId","deadline","tasks":[{"title","description","assigneeId","deadline","estimatedHours"}]}],"unresolved":[{"path","reason"}]}

Rules:
- FINAL DECISIONS WIN. When something is revised, corrected or replaced later in the meeting (deadline, hours, owner, scope), use the last agreed value. A closing recap overrides earlier discussion. Ignore initial/tentative values.
- Each distinct client engagement is its own project, even if the same people work on several. Never merge projects, and never merge tasks that were agreed as separate tasks (even with the same owner).
- Create tasks only for work the team agreed to do in this phase. Do NOT create tasks for features that were rejected, excluded, deferred or called future work.
- Put explicit scope boundaries (what is included and what is excluded) into the project description and relevant task descriptions, in 1-2 plain sentences.
- Use ONLY ids from the directory. managerId must belong to a MANAGER, assigneeId to an AGENT. People who are not in the directory (clients, end users, external contacts) must never be assigned work or added.
- estimatedHours is developer effort in hours for that task as agreed, not calendar days, and not management time. Must be a positive number.
- Dates are YYYY-MM-DD. The meeting is on 2026-10-07 and all deadlines are in 2026. A task deadline must not be later than its project deadline.
- Use the task names as they were spoken in the meeting.
- NEVER guess. If a required value (manager, owner, hours, deadline, name, client) cannot be determined, set it to null and add an entry to "unresolved" saying what is missing.
```

# ANSWER KEY (TEST ONLY: use ONLY inside `scripts/verify.mjs`; must never appear in app code, prompts, seed, or as a fallback)
Expected after running the supplied transcript: 3 projects, 12 tasks.
| Project | Client | Manager | Deadline | Task | Owner | Deadline | Hours |
|---|---|---|---|---|---|---|---|
| UrbanCart Website | UrbanCart Clothing | PM01 | 2026-10-20 | Product catalog UI | DEV01 | 2026-10-12 | 12 |
| | | | | Demo cart UI | DEV01 | 2026-10-15 | 8 |
| | | | | Product and cart APIs | DEV02 | 2026-10-14 | 14 |
| | | | | Website integration and testing | DEV01 | 2026-10-19 | 6 |
| QuickServe Mobile App | QuickServe Services | PM02 | 2026-10-24 | Login and profile screens | DEV03 | 2026-10-12 | 8 |
| | | | | Service booking screens | DEV03 | 2026-10-17 | 12 |
| | | | | Booking and account APIs | DEV02 | 2026-10-16 | 16 |
| | | | | Mobile integration and testing | DEV04 | 2026-10-22 | 10 |
| HelpDeskPro AI Assistant | HelpDeskPro Solutions | PM03 | 2026-10-22 | FAQ document processing | DEV06 | 2026-10-13 | 10 |
| | | | | Assistant answer generation | DEV05 | 2026-10-17 | 14 |
| | | | | Human escalation flow | DEV05 | 2026-10-18 | 6 |
| | | | | Assistant evaluation and testing | DEV06 | 2026-10-21 | 8 |
Traps the AI must handle: UrbanCart deadline is 20 Oct (not 18) and integration due 19 Oct (not 17); QuickServe integration is 10h (not 8); HelpDeskPro testing owner is Maryam (not Zain); Kamran is not an employee; no payment, inventory, maps, real-email, or management-hour tasks.
Changed-input test: edit QuickServe integration to 12 hours and deadline 23 Oct in the transcript; only that task changes.

# ACCEPTANCE CHECK
`npm run verify` (`scripts/verify.mjs`): connects to the DB, compares saved projects/tasks to the key above (match tasks by title + project name), prints PASS/FAIL per row plus totals (3 projects, 12 tasks; hours 40/46/38), and exits non-zero on mismatch. Run it after each transcript test. Also add a short access check (can be same script) that, for Ali, Ayesha and Hamza, calls the access functions and asserts counts: Ali sees 1 project and 3 tasks, Ayesha sees 1 project with 4 tasks, Hamza sees 2 projects with 1 task each, and an agent asking for a project that has none of their tasks gets null.

# ARCHITECTURE AND QUALITY RULES
- Server Components by default; `"use client"` only for the login form and the transcript form. Keep files small, named by feature.
- All secrets server-side only; never use `NEXT_PUBLIC_` for DB, AI or session values. Never log keys or passwords.
- Parameterized SQL only (no string concatenation). Validate every API body with zod with length limits.
- Fetch independent data with `Promise.all`. Avoid N+1 queries: load tasks for a project list with one query.
- Required UI states for every page: loading (`loading.tsx` with skeletons), empty, error (`error.tsx`), success. Disable submit buttons while pending; prevent double submit.
- Responsive from 360px; semantic HTML, labelled inputs, visible focus; per-page `metadata.title`. Consistent clean look using the existing ui kit and `--primary` token. Make the project detail and task table look good: this is what judges screenshot.
- Strict TypeScript, no `any`, no dead code, no TODO placeholders, no fake buttons.
- Self-hosted fonts only; no CDN links.

# ENV VARS (list ONLY these in `.env.example`; real values only in `.env.local` / Vercel settings)
`DATABASE_URL`, `SESSION_SECRET`, `LLM_PROVIDER_ORDER`, `GEMINI_API_KEY`, `GEMINI_MODELS`, `GROQ_API_KEY`, `GROQ_MODELS`, `OPENROUTER_API_KEY`, `OPENROUTER_MODELS`.

# WORKFLOW (follow strictly)
1. FIRST reply only: restate the task in 3 lines, list files/routes you will create or change, the final SQL and zod shapes you will use, and any assumptions. Max ~30 lines, no code. Wait for my "go".
2. After "go": implement P0 in the mandatory order. After each milestone run `npx tsc --noEmit`, `npm run lint`, then `npm run build` before calling it done, and tell me exactly what to click to verify it.
3. Do not ask clarifying questions mid-build. Pick the most reasonable assumption, state it in one line, continue.
4. Keep changes scoped to the feature; do not refactor or reformat files you were not asked to touch (my teammate is editing other areas in parallel).
5. After each working feature give a one-line commit message.

# DEPLOYMENT (at T+2:00; Vercel + hosted Postgres)
- Vercel project from the GitHub repo. Env vars set in Vercel: all names above. Run `db:setup` and `db:seed` against the hosted DB (same `DATABASE_URL`). `export const maxDuration = 60` on the transcript route. Verify on the live URL: login, transcript conversion with the sample, role views, refresh persistence.
- If the live AI call times out on Vercel, tell me immediately instead of working around it silently.

# README (final step; fill the provided template `docs/README_TEMPLATE.md` into root `README.md`)
Fill every placeholder with real values: team {{TEAM_NAME}}, members {{MEMBERS}}, repo {{REPO_URL}}, stack and versions from package.json (Next.js, React, Node, PostgreSQL provider = Aiven), AI provider/models actually used, auth approach (JWT in httpOnly cookie + bcrypt), env var table (only the names above), exact copy-paste setup commands (`npm install`, `cp .env.example .env.local`, `npm run db:setup`, `npm run db:seed`, `npm run dev`), the demo accounts table (exact emails above, `Demo123!`), the judge test steps adjusted to our real routes, how to reset generated work (`npm run db:reset-work`, users untouched), deployment steps and live URL, demo video link {{VIDEO_URL}}, honest Known Limitations (mark anything incomplete; mention AI free-tier rate limits and cold starts). Never include real keys.

# DEFINITION OF DONE
- Supplied transcript -> exactly 3 projects / 12 tasks matching the answer key (`npm run verify` all PASS) and the modified-transcript test changes only the intended task.
- Role checks pass: admin sees all; Ayesha only UrbanCart; Ali 3 tasks; Hamza 2 tasks across 2 projects; direct URL/API access to another user's project returns 404; non-admin POST to `/api/transcript` returns 403.
- Invalid input handled: empty transcript, a transcript with an unknown person/missing deadline (nothing saved, readable error), AI failure (nothing saved), double-click (one creation).
- `npm run build` passes with zero TypeScript/lint errors. Works at 360px and desktop. Live deployment works with the hosted DB, and also runs locally from `.env.local`.
- README complete; no secrets in git.

# DO NOT
- Do not rebuild what the starter provides. Do not add auth libraries, ORMs, queues, websockets, or microservices.
- Do not use localStorage for auth or data. Do not put the answer key or any canned output in app code.
- Do not pretend something works: if a part is mocked or incomplete, say so and list it for the README's Known Limitations.
