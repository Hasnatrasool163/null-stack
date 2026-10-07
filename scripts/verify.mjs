// Acceptance check. TEST ONLY: the answer key below must never be used by app code.
// Usage: npm run verify   (dev server must be running for the access checks;
// set BASE_URL to check a deployed app, default http://localhost:3000)
import { connect } from "./_db.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const KEY = [
  { name: "UrbanCart Website", client: "UrbanCart Clothing", manager: "PM01", deadline: "2026-10-20", hours: 40, tasks: [
    ["Product catalog UI", "DEV01", "2026-10-12", 12],
    ["Demo cart UI", "DEV01", "2026-10-15", 8],
    ["Product and cart APIs", "DEV02", "2026-10-14", 14],
    ["Website integration and testing", "DEV01", "2026-10-19", 6],
  ] },
  { name: "QuickServe Mobile App", client: "QuickServe Services", manager: "PM02", deadline: "2026-10-24", hours: 46, tasks: [
    ["Login and profile screens", "DEV03", "2026-10-12", 8],
    ["Service booking screens", "DEV03", "2026-10-17", 12],
    ["Booking and account APIs", "DEV02", "2026-10-16", 16],
    ["Mobile integration and testing", "DEV04", "2026-10-22", 10],
  ] },
  { name: "HelpDeskPro AI Assistant", client: "HelpDeskPro Solutions", manager: "PM03", deadline: "2026-10-22", hours: 38, tasks: [
    ["FAQ document processing", "DEV06", "2026-10-13", 10],
    ["Assistant answer generation", "DEV05", "2026-10-17", 14],
    ["Human escalation flow", "DEV05", "2026-10-18", 6],
    ["Assistant evaluation and testing", "DEV06", "2026-10-21", 8],
  ] },
];

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};
const norm = (s) => s.trim().toLowerCase();

async function verifyData() {
  console.log("\n== Saved data vs answer key ==");
  const client = connect();
  await client.connect();
  try {
    const projects = (await client.query(
      "SELECT id, name, client_name, manager_id, deadline FROM projects",
    )).rows;
    const tasks = (await client.query(
      `SELECT t.title, t.assignee_id, t.deadline, t.estimated_hours, p.name AS project_name
         FROM tasks t JOIN projects p ON p.id = t.project_id`,
    )).rows;

    check(projects.length === 3, "3 projects saved", `found ${projects.length}`);
    check(tasks.length === 12, "12 tasks saved", `found ${tasks.length}`);

    for (const k of KEY) {
      const p = projects.find((x) => norm(x.name) === norm(k.name));
      check(!!p, `Project exists: ${k.name}`);
      if (p) {
        check(norm(p.client_name) === norm(k.client), `  client = ${k.client}`, p.client_name);
        check(p.manager_id === k.manager, `  manager = ${k.manager}`, p.manager_id);
        check(p.deadline === k.deadline, `  deadline = ${k.deadline}`, p.deadline);
      }
      const mine = tasks.filter((t) => norm(t.project_name) === norm(k.name));
      const sum = mine.reduce((s, t) => s + t.estimated_hours, 0);
      check(sum === k.hours, `  total hours = ${k.hours}`, `found ${sum}`);
      for (const [title, owner, deadline, hours] of k.tasks) {
        const t = mine.find((x) => norm(x.title) === norm(title));
        if (!t) { check(false, `  task exists: ${title}`); continue; }
        const ok = t.assignee_id === owner && t.deadline === deadline && t.estimated_hours === hours;
        check(ok, `  ${title}: ${owner}, ${deadline}, ${hours}h`,
          `found ${t.assignee_id}, ${t.deadline}, ${t.estimated_hours}h`);
      }
      const extra = mine.filter((t) => !k.tasks.some(([title]) => norm(title) === norm(t.title)));
      for (const t of extra) check(false, `  unexpected task: ${t.title}`);
    }
  } finally {
    await client.end();
  }
}

async function login(email) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Demo123!" }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function api(path, cookie) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: cookie ? { cookie } : {} });
  return { status: res.status, body: res.ok ? await res.json() : null };
}

async function verifyAccess() {
  console.log("\n== Role-based access (over HTTP) ==");
  try {
    const view = async (email) => {
      const cookie = await login(email);
      const list = await api("/api/projects", cookie);
      const details = await Promise.all(list.body.projects.map((p) => api(`/api/projects/${p.id}`, cookie)));
      return { cookie, projects: list.body.projects, taskCounts: details.map((d) => d.body.tasks.length) };
    };
    const ali = await view("ali@novaworks.example");
    check(ali.projects.length === 1, "Ali sees 1 project", String(ali.projects.length));
    check(ali.taskCounts.reduce((a, b) => a + b, 0) === 3, "Ali sees 3 tasks", ali.taskCounts.join(","));

    const ayesha = await view("ayesha@novaworks.example");
    check(ayesha.projects.length === 1, "Ayesha sees 1 project", String(ayesha.projects.length));
    check(ayesha.taskCounts[0] === 4, "Ayesha sees 4 tasks in it", ayesha.taskCounts.join(","));

    const hamza = await view("hamza@novaworks.example");
    check(hamza.projects.length === 2, "Hamza sees 2 projects", String(hamza.projects.length));
    check(hamza.taskCounts.length === 2 && hamza.taskCounts.every((n) => n === 1),
      "Hamza sees 1 task in each", hamza.taskCounts.join(","));

    const admin = await view("admin@novaworks.example");
    check(admin.projects.length === 3, "Admin sees 3 projects", String(admin.projects.length));

    const other = admin.projects.find((p) => !ali.projects.some((q) => q.id === p.id));
    if (other) {
      const res = await api(`/api/projects/${other.id}`, ali.cookie);
      check(res.status === 404, "Ali requesting another project gets 404", String(res.status));
    }
    check((await api("/api/projects")).status === 401, "No session gets 401");
    const post = await fetch(`${BASE_URL}/api/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: ali.cookie },
      body: JSON.stringify({ transcript: "x" }),
    });
    check(post.status === 403, "Non-admin POST /api/transcript gets 403", String(post.status));
  } catch (e) {
    check(false, `Access checks could not run against ${BASE_URL}`, e instanceof Error ? e.message : String(e));
  }
}

await verifyData();
await verifyAccess();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
