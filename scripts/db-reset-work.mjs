import { connect } from "./_db.mjs";

const client = connect();
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("DELETE FROM tasks");
  await client.query("DELETE FROM projects");
  await client.query("COMMIT");
  console.log("All projects and tasks deleted. Users untouched.");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  await client.end();
}
