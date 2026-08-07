import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";
import {
  buildMigrationManifest,
  checksumStableValue,
  legacyTableNames,
} from "../src/migration-manifest.ts";

const inputArgument = process.argv.slice(2).find((value) => value.startsWith("--input="));
const connectionString = process.env.POSTGRES_URL;
if (!inputArgument || !connectionString) {
  throw new Error("--input and POSTGRES_URL are required for PostgreSQL import.");
}

const inputPath = resolve(inputArgument.slice("--input=".length));
const decoded = JSON.parse(await readFile(inputPath, "utf8"));
if (
  !decoded ||
  decoded.version !== 1 ||
  !Array.isArray(decoded.tables) ||
  typeof decoded.exportedAt !== "string"
) {
  throw new Error("The D1 snapshot format is invalid.");
}
const allowedTables = new Set(legacyTableNames);
for (const table of decoded.tables) {
  if (!allowedTables.has(table?.table) || !Array.isArray(table?.rows)) {
    throw new Error("The D1 snapshot contains an unknown table or invalid rows.");
  }
}

const manifest = await buildMigrationManifest(decoded.tables, decoded.exportedAt);
const sourceChecksum = await checksumStableValue(decoded.tables);
const migrationRunId = `migration_${sourceChecksum.slice(0, 24)}`;
const database = postgres(connectionString, { max: 1 });

function ownerFrom(row) {
  for (const key of ["user_id", "owner_user_id", "actor_user_id", "target_user_id"]) {
    if (typeof row[key] === "string" && row[key]) return row[key];
  }
  return null;
}

try {
  await database.begin(async (transaction) => {
    await transaction`
      insert into data_migration_runs (
        id, source_system, source_snapshot_id, source_checksum,
        row_counts, status, report
      ) values (
        ${migrationRunId}, 'cloudflare-d1', ${sourceChecksum}, ${sourceChecksum},
        ${transaction.json(Object.fromEntries(manifest.tables.map((table) => [table.sourceTable, table.rowCount])))},
        'staging', ${transaction.json({ sourceFile: inputPath })}
      )
      on conflict (source_system, source_snapshot_id) do nothing
    `;

    for (const table of decoded.tables) {
      for (const [index, row] of table.rows.entries()) {
        const sourceRowId = String(row.id ?? row.key ?? `row_${index}`);
        const rowChecksum = await checksumStableValue(row);
        const stagingId = `legacy_${(
          await checksumStableValue([sourceChecksum, table.table, sourceRowId])
        ).slice(0, 32)}`;
        await transaction`
          insert into legacy_import_rows (
            id, migration_run_id, source_table, source_row_id,
            owner_user_id, source_tenant_id, row_checksum, payload
          ) values (
            ${stagingId}, ${migrationRunId}, ${table.table}, ${sourceRowId},
            ${ownerFrom(row)}, ${typeof row.tenant_id === "string" ? row.tenant_id : null},
            ${rowChecksum}, ${transaction.json(row)}
          )
          on conflict (migration_run_id, source_table, source_row_id) do nothing
        `;
      }
    }

    const counts = await transaction`
      select source_table, count(*)::integer as row_count
      from legacy_import_rows
      where migration_run_id = ${migrationRunId}
      group by source_table
    `;
    const stagedCounts = Object.fromEntries(
      counts.map((row) => [row.source_table, row.row_count]),
    );
    for (const table of manifest.tables) {
      if ((stagedCounts[table.sourceTable] ?? 0) !== table.rowCount) {
        throw new Error(`Staged row count mismatch for ${table.sourceTable}.`);
      }
    }
    await transaction`
      update data_migration_runs
      set status = 'staged',
          id_mapping_checksum = ${await checksumStableValue(stagedCounts)},
          report = ${transaction.json({ stagedCounts, normalizationPending: true })},
          completed_at = now()
      where id = ${migrationRunId}
    `;
  });
  process.stdout.write(
    `Staged ${manifest.totalRows} D1 rows in migration run ${migrationRunId}.\n`,
  );
} finally {
  await database.end();
}
