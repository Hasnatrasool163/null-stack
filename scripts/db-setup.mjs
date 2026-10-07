// Applies pending schema migrations. The SQL lives in ONE place: src/lib/db.ts
// (Node 24 imports the .ts file directly). The app also runs this on first query.
import { getPool, migrate } from "../src/lib/db.ts";

try {
  const applied = await migrate();
  console.log(
    applied.length
      ? `Applied migrations: ${applied.join(", ")}`
      : "Schema is up to date.",
  );
} finally {
  await getPool().end();
}
