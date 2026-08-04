import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL is required to verify PostgreSQL.");
}

const requiredTables = [
  "users",
  "lms_connections",
  "resources",
  "resource_versions",
  "resource_chunks",
  "concepts",
  "learning_sessions",
  "concept_mastery",
  "daily_plans",
  "tool_runs",
  "ai_interactions",
  "audit_logs",
  "legacy_import_rows",
];
const database = postgres(connectionString, { max: 1 });
try {
  const extension = await database`
    select extversion from pg_extension where extname = 'vector'
  `;
  if (!extension[0]?.extversion) throw new Error("pgvector is not installed.");

  const tables = await database`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = any(${requiredTables})
  `;
  const found = new Set(tables.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length) throw new Error(`Missing PostgreSQL tables: ${missing.join(", ")}.`);

  const vectorColumn = await database`
    select format_type(atttypid, atttypmod) as type
    from pg_attribute
    where attrelid = 'resource_chunks'::regclass and attname = 'embedding'
  `;
  if (vectorColumn[0]?.type !== "vector(1536)") {
    throw new Error("resource_chunks.embedding is not vector(1536)." );
  }
  const vectorIndex = await database`
    select indexname from pg_indexes
    where indexname = 'resource_chunks_embedding_hnsw_idx'
  `;
  if (!vectorIndex.length) throw new Error("The resource chunk HNSW index is missing.");
  process.stdout.write(`PostgreSQL foundation verified with pgvector ${extension[0].extversion}.\n`);
} finally {
  await database.end();
}
