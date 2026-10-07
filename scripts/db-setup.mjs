import { connect } from "./_db.mjs";

const SQL = `
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

-- Kanban + audit fields (additive, safe to re-run on an existing database).
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
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

-- One discussion thread per task.
CREATE TABLE IF NOT EXISTS task_comments (
  id text PRIMARY KEY, task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES users(id), body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS task_comments_task_idx ON task_comments(task_id, created_at);

-- Saved transcript analyses: summary, open questions and next-meeting agenda.
CREATE TABLE IF NOT EXISTS meetings (
  id text PRIMARY KEY, created_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '', summary text NOT NULL DEFAULT '',
  open_questions jsonb NOT NULL DEFAULT '[]'::jsonb, agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_ids text[] NOT NULL DEFAULT '{}', saved boolean NOT NULL DEFAULT false);
`;

const client = connect();
await client.connect();
try {
  await client.query(SQL);
  console.log("Tables ready.");
} finally {
  await client.end();
}
