// Shared pg client factory for scripts. Run scripts with: node --env-file=.env.local
import pg from "pg";

pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => parseFloat(v));

export function connect() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set (use --env-file=.env.local)");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  return new pg.Client({
    connectionString: url.toString(),
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}
