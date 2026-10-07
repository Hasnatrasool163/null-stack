# NullToPlan - AI Meeting to Project CRM

NullToPlan turns a meeting transcript into a saved project plan. An admin pastes or drops a transcript; the AI checks that it is about technical work, extracts projects, tasks, owners, deadlines and estimated hours, validates every value against the team directory, and saves everything in one transaction. It also writes a meeting summary, open questions and a suggested agenda for the next meeting. Managers and developers then work from role-scoped views: a dashboard, a Kanban board with a discussion thread on every task, and editable project pages.

## Team
- Team name: Null Stack
- Members and responsibilities:
  - Hamad Jamil - TODO: responsibilities
  - Muhammad Hasnat Rasool - TODO: responsibilities
  - TODO: third member - responsibilities
  - TODO: fourth member - responsibilities
- Repository: https://github.com/Hasnatrasool163/null-stack

## What Works
- **Login and roles:** seeded accounts for Admin, three Managers and six Developers (agents). Sessions are signed, http-only cookies; the user and role are always re-loaded from the database.
- **Create from Transcript (admin):** paste text, or drag and drop / upload a `.txt`, `.md`, `.vtt` or `.srt` file (caption timestamps are stripped, speaker names kept). Live progress steps, Cmd/Ctrl+Enter to submit, character counter.
- **AI analysis:**
  - Relevance check first: a meeting that is not about software/IT/technical work is explained and nothing is saved.
  - Extracts projects and tasks, using only people from the team directory. Final decisions in the meeting win over earlier values; rejected or deferred work is excluded.
  - Every value is validated on the server (real dates, task deadline not after project deadline, positive hours, manager is a Manager, assignee is a Developer). One automatic repair attempt; if anything is still missing, **nothing is saved** and each problem is listed so the admin can fix the transcript.
  - Meeting insights: summary, open questions, and 3-8 suggested agenda items for the next meeting (open question, missing detail, follow-up, risk, decision needed).
- **Duplicate transcripts:** re-submitting the same transcript is detected before calling the AI. The admin chooses **Replace previous** (old projects are removed only if the new analysis succeeds) or **Keep both**.
- **Transcript history (admin):** every analysis, including ones that were not relevant or needed fixes, with the original text, findings, projects created, and "Re-run in editor".
- **Dashboard (`/projects`):** KPI tiles, searchable/sortable project cards with deadline countdowns, upcoming deadlines, team workload, and the latest suggested agenda.
- **Project page:** client, manager, deadline, effort, and a sortable task table that can be grouped by assignee. Admins and the project's manager can edit the project (admins can also reassign the manager), delete it, add tasks, and open any task to edit its title, description, assignee, deadline and hours, or delete it.
- **Kanban board (`/board`):** To do / In progress / In review / Done with drag and drop, filters, and a task panel showing assignee, project manager, deadline, hours, created date, reported by, last edited by, resource links (Figma, docs) and a discussion thread.
- **My Tasks (developers):** their tasks grouped by project with status and deadline countdown.
- **Team directory:** names, roles, specialisations and skills (no emails).
- **Access control on the server:** Admin sees everything; a Manager sees only projects they manage; a Developer sees only projects containing their tasks and only their own tasks. Hidden records return 404, never 403, so existence is not leaked.
- **Persistence:** everything is stored in PostgreSQL; schema migrations apply automatically.
- **UI:** responsive from 360px, keyboard accessible, light and dark themes (Light / Dark / System), loading skeletons and instant back-navigation.

Not done / partial: see [Known Limitations](#known-limitations).

## Technology Stack
- Frontend: Next.js 16.4 (App Router, React 19.3, Server Components), Tailwind CSS 4, Radix UI primitives, TanStack Query 5, lucide icons
- Backend: Next.js route handlers on Node.js 24 (TypeScript 5), zod 4 for request validation
- Database: PostgreSQL (managed, Aiven) via `pg` 8, plain parameterised SQL, versioned migrations in `src/lib/db.ts`
- AI: Google Gemini `gemini-2.5-flash` (primary) with OpenRouter `gpt-4o-mini` as fallback, called through the OpenAI-compatible SDK; JSON output validated with zod
- Authentication/session: email + password (bcrypt hashes) -> HS256-signed JWT in an http-only, SameSite=Lax cookie (8 h). Every request verifies the cookie and reloads the user and role from the database; the client never supplies an id or role.

## Links
- Live application: TODO - not deployed yet
- Demo video: TODO - add recording URL

## Requirements
- Node.js 24 or newer (the setup scripts import TypeScript directly) and npm 11
- A PostgreSQL database (local, or hosted such as Aiven; we use Aiven. TLS is handled automatically for non-local hosts)
- At least one AI API key: Google AI Studio (Gemini), Groq or OpenRouter

## Run Locally
1. Clone this repository and enter its directory:
   ```sh
   git clone https://github.com/Hasnatrasool163/null-stack.git
   cd null-stack
   ```
2. Install dependencies (single Next.js app, no separate backend folder):
   ```sh
   npm install
   ```
3. Copy the environment template:
   ```sh
   cp .env.example .env.local
   ```
4. Fill in `.env.local` (see [Environment Variables](#environment-variables)). For a local database:
   `DATABASE_URL=postgres://user:password@localhost:5432/novaworks`
5. Create the database if it does not exist (local Postgres example):
   ```sh
   createdb novaworks
   ```
6. Apply the schema (idempotent; the app also applies pending migrations on its first query):
   ```sh
   npm run db:setup
   ```
7. Seed the ten demo users (safe to re-run; it upserts by email):
   ```sh
   npm run db:seed
   ```
8. Start the app and open http://localhost:3000:
   ```sh
   npm run dev
   ```
   Only this one terminal needs to keep running. For a production build: `npm run build && npm start`.

## Environment Variables
| Variable | Purpose | Where configured |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Server only (`.env.local` / host settings) |
| `SESSION_SECRET` | Signs session cookies (32+ random characters) | Server only |
| `LLM_PROVIDER_ORDER` | Providers to try, in order, e.g. `gemini,openrouter` | Server only |
| `GEMINI_API_KEY` | Google AI Studio key | Server only |
| `GEMINI_MODELS` | Gemini model(s), e.g. `gemini-2.5-flash` | Server only |
| `GROQ_API_KEY` | Groq key (optional) | Server only |
| `GROQ_MODELS` | Groq model(s), e.g. `llama-3.3-70b-versatile` | Server only |
| `OPENROUTER_API_KEY` | OpenRouter key (optional fallback) | Server only |
| `OPENROUTER_MODELS` | OpenRouter model(s) | Server only |

Providers without a key are skipped. No variable is exposed to the browser (nothing uses `NEXT_PUBLIC_`). `.env.example` contains placeholders only; never commit `.env.local`.

## Demo Login Accounts
These emails are fictional identifiers, not mailboxes. Signup, email verification, and forgot password are intentionally not included.

| Role | Name | Demo email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik | hina@novaworks.example | Demo123! |
| Agent (Developer) | Ali Raza | ali@novaworks.example | Demo123! |
| Agent (Developer) | Hamza Shah | hamza@novaworks.example | Demo123! |
| Agent (Developer) | Sara Noor | sara@novaworks.example | Demo123! |
| Agent (Developer) | Usman Tariq | usman@novaworks.example | Demo123! |
| Agent (Developer) | Zain Abbas | zain@novaworks.example | Demo123! |
| Agent (Developer) | Maryam Asif | maryam@novaworks.example | Demo123! |

Run `npm run db:seed` once after `npm run db:setup`. Re-running it updates the same ten users and never duplicates them.

## How Judges Can Test
1. Log in as **admin@novaworks.example**; open **Create from Transcript**.
2. Click **Load sample transcript** (the file is `src/data/transcript.txt`), or drag that file onto the transcript box.
3. Click **Create from Transcript** (10-40 s). Expect **3 projects and 12 tasks**, the generated task details, and a suggested agenda for the next meeting.
4. Open **UrbanCart Website**: manager Ayesha Khan, deadline **20 Oct 2026**, four tasks.
5. Log out and log in as **ayesha@novaworks.example**: only her project appears.
6. Log in as **ali@novaworks.example**: only his three UrbanCart tasks appear (My Tasks and Board).
7. Log in as **hamza@novaworks.example**: two tasks across UrbanCart and QuickServe.
8. Direct access is blocked on the server: while logged in as Ali, open another project's URL or `GET /api/projects/<id>` - it returns 404. Logged out, `GET /api/projects` returns 401.
9. Refresh any page: everything persists.
10. Changed input: edit the transcript so the QuickServe integration task is 12 hours and due 23 October, submit, and choose **Keep both** or **Replace previous**; only that task should change. Submitting the unchanged sample again shows the duplicate dialog without calling the AI.
11. Extra checks: submit a non-technical meeting (e.g. a team lunch plan) to see the relevance message; move a card on **Board** and comment on it; as Ayesha, edit her project or reassign a task's developer.

Automated check against the answer key: `npm run verify` (prints PASS/FAIL per task, totals, and the access checks).

**Reset between tests** (deletes projects, tasks, comments and transcript history; keeps the ten users):
```sh
npm run db:reset-work
```

## Deployment Details
- Deployment status: TODO - local only so far
- Frontend host: TODO
- Backend host: same Next.js app (route handlers run on the same host)
- Database: PostgreSQL on Aiven (managed, TLS)
- Deployed branch/commit: TODO

### How We Deployed
TODO when deployed. The intended path (one Next.js app, e.g. on Vercel):
1. Build command `npm run build`, start command `npm start` (Vercel detects Next.js automatically).
2. No separate backend service: API routes are part of the same app (Node.js runtime).
3. Use the Aiven PostgreSQL service URL as `DATABASE_URL`; `sslmode` is stripped and TLS is enabled automatically for non-local hosts.
4. Set `DATABASE_URL`, `SESSION_SECRET`, `LLM_PROVIDER_ORDER` and the AI key/model variables in the host's environment settings.
5. Run `npm run db:setup` and `npm run db:seed` once against the hosted database (from a machine with `.env.local` pointing at it). Migrations also apply automatically on first request.
6. No frontend API URL or CORS configuration is needed (same origin).
7. Judges log in with the demo accounts above; the AI works with the keys configured on the host.

## Known Limitations
- Not deployed yet and no demo video yet (see TODOs above).
- AI calls take 10-40 s and depend on free-tier quota; if every provider fails, a friendly error is shown and nothing is saved.
- Only one transcript is processed at a time per server instance (in-process lock; a second request gets "busy").
- Duplicate detection matches the same text exactly (ignoring spacing and capitalisation), not paraphrased transcripts.
- Transcript files must be plain text (`.txt`, `.md`, `.vtt`, `.srt`); PDF and Word are rejected with a message.
- Comment threads refresh every 15 seconds rather than in real time; there are no notifications.
- Transcripts analysed before the history feature was added have no stored text.
- The newest features (board, editing, history) were type-checked, linted and built, but have had limited end-to-end testing.

## Submission Summary
- Source repository: https://github.com/Hasnatrasool163/null-stack
- Live link or local demo video: TODO
- Setup and seed commands: `npm install`, `npm run db:setup`, `npm run db:seed`, `npm run dev` (documented above)
- Demo login accounts: the ten seeded accounts above, password `Demo123!`
- Features completed: role-based login; AI transcript-to-project flow with relevance check, validation, repair and all-or-nothing save; meeting summary and next-meeting agenda; duplicate detection; transcript history; dashboard; project and task editing for admins and managers; Kanban board with task threads and links; developer task view; team directory; light/dark themes
