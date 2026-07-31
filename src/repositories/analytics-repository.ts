import type { D1DatabaseLike } from "./types.ts";

export class AnalyticsRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async record(input: {
    id: string;
    userId: string | null;
    eventName: string;
    category: string;
    properties: Record<string, unknown>;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO usage_events (
           id, user_id, event_name, event_category, properties_json,
           created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.eventName,
        input.category,
        JSON.stringify(input.properties),
        input.now,
      )
      .run();
  }
}
