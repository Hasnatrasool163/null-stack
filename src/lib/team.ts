import { query } from "@/lib/db";
import type { Role, TeamMember } from "@/lib/types";

type UserRow = {
  id: string;
  name: string;
  role: Role;
  specialization: string;
  skills: string[];
};

/** Public directory: no emails or password hashes are ever selected. */
export async function getTeam(): Promise<TeamMember[]> {
  return query<UserRow>(
    `SELECT id, name, role, specialization, skills FROM users
      ORDER BY CASE role WHEN 'ADMIN' THEN 0 WHEN 'MANAGER' THEN 1 ELSE 2 END, id`,
  );
}
