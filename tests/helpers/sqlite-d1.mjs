import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

class SqliteD1Statement {
  #statement;
  #values = [];

  constructor(database, query, statement = null, values = []) {
    this.#statement = statement ?? database.prepare(query);
    this.#values = values;
  }

  bind(...values) {
    return new SqliteD1Statement(
      null,
      "",
      this.#statement,
      values,
    );
  }

  async first(columnName) {
    const row = this.#statement.get(...this.#values);
    if (row === undefined) return null;
    return columnName ? row[columnName] ?? null : row;
  }

  async run() {
    return this.runSync();
  }

  runSync() {
    const result = this.#statement.run(...this.#values);
    return {
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
      },
      results: [],
    };
  }

  async all() {
    return {
      success: true,
      meta: {},
      results: this.#statement.all(...this.#values),
    };
  }

  async raw(options = {}) {
    const rows = this.#statement.all(...this.#values);
    if (options.columnNames) {
      return [
        this.#statement.columns().map((column) => column.name),
        ...rows.map((row) => Object.values(row)),
      ];
    }
    return rows.map((row) => Object.values(row));
  }
}

export class SqliteD1 {
  constructor() {
    this.database = new DatabaseSync(":memory:");
    this.database.exec("PRAGMA foreign_keys = ON");
  }

  prepare(query) {
    return new SqliteD1Statement(this.database, query);
  }

  async batch(statements) {
    this.database.exec("BEGIN");
    try {
      const results = statements.map((statement) => statement.runSync());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  async exec(query) {
    this.database.exec(query);
    return { success: true, meta: {} };
  }

  close() {
    this.database.close();
  }
}

export function createMigratedDatabase() {
  const db = new SqliteD1();
  const migrationsDirectory = resolve(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort();
  for (const file of migrationFiles) {
    const migration = readFileSync(resolve(migrationsDirectory, file), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) db.database.exec(statement);
    }
  }
  return db;
}

export function seedVerifiedUser(
  db,
  {
    id,
    email,
    onboardingCompletedAt = null,
    timezone = "Australia/Sydney",
  },
) {
  const now = "2026-07-30T00:00:00.000Z";
  db.database
    .prepare(
      `INSERT INTO users (
         id, email, email_verified_at, preferred_language, timezone,
         role, status, onboarding_completed_at, created_at, updated_at
       ) VALUES (?, ?, ?, 'zh-CN', ?, 'student', 'active', ?, ?, ?)`,
    )
    .run(id, email, now, timezone, onboardingCompletedAt, now, now);
  db.database
    .prepare(
      `INSERT INTO user_settings (
         id, user_id, daily_study_minutes, week_starts_on,
         reminder_enabled, academic_integrity_mode,
         ai_explanation_language, created_at, updated_at
       ) VALUES (?, ?, 60, 1, 1, 1, 'zh-CN', ?, ?)`,
    )
    .run(`settings_${id}`, id, now, now);
}
