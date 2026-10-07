import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// DATE stays a 'YYYY-MM-DD' string (no timezone shifting); NUMERIC becomes a float.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => parseFloat(v));

const globalForPool = globalThis as unknown as {
  __pgPool?: Pool;
  __schemaReady?: Promise<string[]>;
};

function createPool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );
  return new Pool({
    connectionString: url.toString(),
    max: 3,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export function getPool(): Pool {
  globalForPool.__pgPool ??= createPool();
  return globalForPool.__pgPool;
}

/**
 * Schema history, oldest first. Each entry runs once and is recorded in
 * `schema_migrations`. Never edit or reorder an entry that may already have
 * run somewhere: add a new one instead. Statements are idempotent so a
 * database created before this table existed is adopted safely.
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_base",
    sql: `
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
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);`,
  },
  {
    id: "002_task_kanban_fields",
    sql: `
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'TODO';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reported_by text REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_by text REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb;
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_chk
    CHECK (status IN ('TODO','IN_PROGRESS','IN_REVIEW','DONE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);`,
  },
  {
    id: "003_task_comments",
    sql: `
CREATE TABLE IF NOT EXISTS task_comments (
  id text PRIMARY KEY, task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES users(id), body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS task_comments_task_idx ON task_comments(task_id, created_at);`,
  },
  {
    id: "004_meetings",
    sql: `
CREATE TABLE IF NOT EXISTS meetings (
  id text PRIMARY KEY, created_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '', summary text NOT NULL DEFAULT '',
  open_questions jsonb NOT NULL DEFAULT '[]'::jsonb, agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_ids text[] NOT NULL DEFAULT '{}', saved boolean NOT NULL DEFAULT false);`,
  },
];

// Arbitrary constant: every instance takes the same lock, so only one migrates at a time.
const MIGRATION_LOCK_KEY = 728_461_903;

/**
 * Applies pending migrations in order, all in one transaction under an
 * advisory lock (safe when several server instances start together).
 * Returns the ids it applied; [] when the schema was already current.
 */
export async function migrate(): Promise<string[]> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [
      MIGRATION_LOCK_KEY,
    ]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    );
    const { rows } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations",
    );
    const done = new Set(rows.map((r) => r.id));
    const applied: string[] = [];
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await client.query(m.sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [
        m.id,
      ]);
      applied.push(m.id);
    }
    await client.query("COMMIT");
    return applied;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Runs migrate() once per server process; a failure is retried on the next call. */
export function ensureSchema(): Promise<string[]> {
  globalForPool.__schemaReady ??= migrate().catch((e: unknown) => {
    globalForPool.__schemaReady = undefined;
    throw e;
  });
  return globalForPool.__schemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

/** Runs fn inside one BEGIN/COMMIT transaction; ROLLBACK on any error. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
