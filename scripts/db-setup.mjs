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
`;

const client = connect();
await client.connect();
try {
  await client.query(SQL);
  console.log("Tables ready.");
} finally {
  await client.end();
}
