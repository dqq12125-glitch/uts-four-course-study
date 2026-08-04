import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL is required to apply PostgreSQL migrations.");
}

const migrationsDirectory = resolve("packages/database/migrations");
const files = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+.*\.sql$/.test(file))
  .sort();
if (files.length === 0) throw new Error("No PostgreSQL migrations were found.");

const database = postgres(connectionString, { max: 1 });
try {
  await database`
    create table if not exists deepstudy_schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;

  for (const file of files) {
    const sqlText = await readFile(resolve(migrationsDirectory, file), "utf8");
    const checksum = createHash("sha256").update(sqlText).digest("hex");
    const existing = await database`
      select checksum from deepstudy_schema_migrations where name = ${file}
    `;
    if (existing.length > 0) {
      if (existing[0].checksum !== checksum) {
        throw new Error(`Applied migration ${file} no longer matches its checksum.`);
      }
      continue;
    }
    const statements = sqlText
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);
    await database.begin(async (transaction) => {
      for (const statement of statements) await transaction.unsafe(statement);
      await transaction`
        insert into deepstudy_schema_migrations (name, checksum)
        values (${file}, ${checksum})
      `;
    });
    process.stdout.write(`Applied ${file}\n`);
  }
} finally {
  await database.end();
}
