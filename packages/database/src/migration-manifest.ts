export interface LegacyTableExport {
  table: string;
  rows: ReadonlyArray<Readonly<Record<string, unknown>>>;
}

export interface MigrationTableManifest {
  sourceTable: string;
  targetTable: string;
  rowCount: number;
  checksum: string;
  ownerColumns: string[];
}

export interface MigrationManifest {
  version: 1;
  generatedAt: string;
  tables: MigrationTableManifest[];
  totalRows: number;
}

export const legacyTableMapping = {
  users: { target: "users", ownerColumns: [] },
  user_settings: { target: "user_preferences", ownerColumns: ["user_id"] },
  auth_sessions: { target: "auth_sessions", ownerColumns: ["user_id"] },
  magic_link_tokens: { target: "magic_link_tokens", ownerColumns: [] },
  auth_rate_limits: { target: "legacy_import_rows", ownerColumns: [] },
  institutions: { target: "institutions", ownerColumns: [] },
  semesters: { target: "legacy_import_rows", ownerColumns: [] },
  user_semesters: { target: "legacy_import_rows", ownerColumns: ["user_id"] },
  course_templates: { target: "legacy_import_rows", ownerColumns: [] },
  courses: { target: "courses", ownerColumns: ["user_id"] },
  class_sessions: {
    target: "calendar_events",
    ownerColumns: ["user_id", "course_id"],
  },
  topics: { target: "concepts", ownerColumns: ["user_id", "course_id"] },
  learning_resources: {
    target: "resources",
    ownerColumns: ["user_id", "course_id"],
  },
  lms_connections: {
    target: "lms_connections",
    ownerColumns: ["user_id"],
  },
  lms_course_links: {
    target: "legacy_import_rows",
    ownerColumns: ["user_id", "course_id"],
  },
  resources: {
    target: "resources",
    ownerColumns: ["user_id", "course_id"],
  },
  resource_versions: {
    target: "resource_versions",
    ownerColumns: ["user_id"],
  },
  resource_processing_jobs: {
    target: "resource_processing_jobs",
    ownerColumns: ["user_id"],
  },
  resource_chunks: {
    target: "resource_chunks",
    ownerColumns: ["user_id", "course_id"],
  },
  resource_sync_runs: {
    target: "resource_sync_runs",
    ownerColumns: ["user_id", "course_id"],
  },
  resource_extractions: {
    target: "resource_processing_jobs",
    ownerColumns: ["user_id"],
  },
  assessments: {
    target: "assessments",
    ownerColumns: ["user_id", "course_id"],
  },
  practice_sessions: {
    target: "learning_sessions",
    ownerColumns: ["user_id", "course_id"],
  },
  practice_attempts: {
    target: "student_attempts",
    ownerColumns: ["user_id"],
  },
  mastery_records: {
    target: "concept_mastery",
    ownerColumns: ["user_id", "course_id"],
  },
  study_tasks: {
    target: "daily_plan_items",
    ownerColumns: ["user_id", "course_id"],
  },
  focus_sessions: { target: "legacy_import_rows", ownerColumns: ["user_id"] },
  practice_questions: { target: "legacy_import_rows", ownerColumns: [] },
  ai_usage_logs: { target: "ai_interactions", ownerColumns: [] },
  usage_events: { target: "legacy_import_rows", ownerColumns: [] },
  subscriptions: { target: "legacy_import_rows", ownerColumns: ["user_id"] },
  purchases: { target: "legacy_import_rows", ownerColumns: ["user_id"] },
  payment_webhook_events: {
    target: "legacy_import_rows",
    ownerColumns: [],
  },
  feature_flags: { target: "legacy_import_rows", ownerColumns: [] },
  ai_conversations: {
    target: "legacy_import_rows",
    ownerColumns: ["user_id"],
  },
  ai_messages: { target: "legacy_import_rows", ownerColumns: ["user_id"] },
  notification_preferences: {
    target: "legacy_import_rows",
    ownerColumns: ["user_id"],
  },
  notifications: { target: "notifications", ownerColumns: ["user_id"] },
  notification_deliveries: {
    target: "legacy_import_rows",
    ownerColumns: ["user_id"],
  },
  scheduled_job_runs: { target: "legacy_import_rows", ownerColumns: [] },
  support_access_grants: { target: "legacy_import_rows", ownerColumns: [] },
  audit_logs: { target: "audit_logs", ownerColumns: [] },
} as const;

export const legacyTableNames = Object.freeze(
  Object.keys(legacyTableMapping).sort(),
);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function checksumStableValue(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(stableValue(value)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function buildMigrationManifest(
  exports: LegacyTableExport[],
  generatedAt = new Date().toISOString(),
): Promise<MigrationManifest> {
  const tables: MigrationTableManifest[] = [];
  for (const exported of [...exports].sort((a, b) => a.table.localeCompare(b.table))) {
    const mapping = legacyTableMapping[
      exported.table as keyof typeof legacyTableMapping
    ];
    if (!mapping) throw new Error(`No migration mapping exists for ${exported.table}.`);
    for (const [index, row] of exported.rows.entries()) {
      for (const ownerColumn of mapping.ownerColumns) {
        if (typeof row[ownerColumn] !== "string" || !row[ownerColumn]) {
          throw new Error(
            `${exported.table} row ${index} is missing owner column ${ownerColumn}.`,
          );
        }
      }
    }
    tables.push({
      sourceTable: exported.table,
      targetTable: mapping.target,
      rowCount: exported.rows.length,
      checksum: await checksumStableValue(exported.rows),
      ownerColumns: [...mapping.ownerColumns],
    });
  }
  return {
    version: 1,
    generatedAt,
    tables,
    totalRows: tables.reduce((total, table) => total + table.rowCount, 0),
  };
}

export function verifyImportedRowCounts(
  manifest: MigrationManifest,
  importedCounts: Readonly<Record<string, number>>,
): void {
  const expectedByTarget = new Map<string, number>();
  for (const table of manifest.tables) {
    expectedByTarget.set(
      table.targetTable,
      (expectedByTarget.get(table.targetTable) ?? 0) + table.rowCount,
    );
  }
  for (const [targetTable, expected] of expectedByTarget) {
    const imported = importedCounts[targetTable];
    if (imported !== expected) {
      throw new Error(
        `Row count mismatch for ${targetTable}: expected ${expected}, received ${String(imported)}.`,
      );
    }
  }
}
