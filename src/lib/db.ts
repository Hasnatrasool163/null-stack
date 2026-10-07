import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// DATE stays a 'YYYY-MM-DD' string (no timezone shifting); NUMERIC becomes a float.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => parseFloat(v));

const globalForPool = globalThis as unknown as { __pgPool?: Pool };

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

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

/** Runs fn inside one BEGIN/COMMIT transaction; ROLLBACK on any error. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
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
