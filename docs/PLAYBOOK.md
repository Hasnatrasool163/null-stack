# Playbook (2-person team)

## First 20 minutes (do NOT open the editor yet)
1. Restate the problem in one sentence.
2. Pick ONE user and ONE pain point.
3. Write the core flow as 4 steps: input, AI/logic, result, action.
4. Pick ONE "wow" feature. Cut everything else to a "next steps" slide.
5. Agree the JSON shapes between frontend and backend (zod schemas in `src/lib/schemas.ts`).
6. Split: A = UI + flow + demo, B = API + data + AI.

## 3-hour timeline
- 0:00-0:20 plan | 0:20-1:00 vertical slice with fake data | 1:00-2:00 real data + 2nd feature
- 2:00-2:30 polish: empty/loading/error states, odd inputs | 2:30 FEATURE FREEZE, deploy, record video
- 2:45-3:00 rehearse, buffer. No commits after the deadline.

## Prompt template: structured output
System: "You are a {domain expert}. Return ONLY valid JSON matching: {schema description}. No prose. If the input is unclear, return your best guess and set `notes`."
User: "{user input}"
Use `structured(Schema, messages)`, never parse model text by hand.

## Prompt template: build with an AI coding tool
"Next.js App Router + Tailwind project. Add a page /plan with a form (react-hook-form + zod), POST to /api/plan which calls `structured()` from src/lib/llm.ts, and render the result as cards. Include a loading skeleton and an error toast. Use the existing components in src/components/ui."

## Demo script (2-3 min)
1. Problem + user (20s) 2. Live flow with a judge-style input (60s) 3. Where AI is used + architecture in one sentence (30s)
4. What makes it useful (20s) 5. Next steps (20s)
Pre-test 3 inputs, including a weird one. Keep the backup video open in another tab.

## Failure plan
- AI provider down: `chat()` already falls through providers. Also keep one cached good result and tell the judges it's cached.
- Wi-Fi down: switch to your hotspot. Run the demo from localhost, not only the deployed URL.
- Judge asks "how does this work?": know the request path: UI -> /api route -> llm.ts -> provider -> zod validation -> UI.
