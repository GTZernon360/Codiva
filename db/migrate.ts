import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const migrationDir = path.join(process.cwd(), "db", "migrations");
const migrations = (await readdir(migrationDir))
  .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/.test(file))
  .sort();

try {
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
    );

    for (const name of migrations) {
      const existing = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name],
      );
      if (existing.rowCount) {
        console.log(`Skipping ${name}`);
        continue;
      }

      const sql = await readFile(path.join(migrationDir, name), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
