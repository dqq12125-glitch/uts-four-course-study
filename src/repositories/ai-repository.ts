import type { D1DatabaseLike } from "./types.ts";

export interface AiCourseContext {
  courseId: string;
  courseCode: string | null;
  courseName: string;
  topicId: string | null;
  topicTitle: string | null;
  currentTask: string | null;
}

export interface AiConversationRecord {
  id: string;
  courseId: string | null;
  topicId: string | null;
  title: string;
  status: string;
}

export interface AiHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export class AiRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async courseContext(
    userId: string,
    courseId: string,
    topicId: string | null,
    currentTaskId: string | null,
  ): Promise<AiCourseContext | null> {
    const course = await this.db
      .prepare(
        `SELECT id AS courseId, course_code AS courseCode,
           course_name AS courseName
         FROM courses
         WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      )
      .bind(courseId, userId)
      .first<{
        courseId: string;
        courseCode: string | null;
        courseName: string;
      }>();
    if (!course) return null;

    const [topic, task] = await Promise.all([
      topicId
        ? this.db
            .prepare(
              `SELECT id, title
               FROM topics
               WHERE id = ? AND course_id = ? AND user_id = ?`,
            )
            .bind(topicId, courseId, userId)
            .first<{ id: string; title: string }>()
        : Promise.resolve(null),
      currentTaskId
        ? this.db
            .prepare(
              `SELECT title
               FROM study_tasks
               WHERE id = ? AND course_id = ? AND user_id = ?`,
            )
            .bind(currentTaskId, courseId, userId)
            .first<{ title: string }>()
        : Promise.resolve(null),
    ]);
    if (topicId && !topic) return null;
    if (currentTaskId && !task) return null;
    return {
      ...course,
      topicId: topic?.id ?? null,
      topicTitle: topic?.title ?? null,
      currentTask: task?.title ?? null,
    };
  }

  async conversation(
    userId: string,
    conversationId: string,
  ): Promise<AiConversationRecord | null> {
    return this.db
      .prepare(
        `SELECT id, course_id AS courseId, topic_id AS topicId,
           title, status
         FROM ai_conversations
         WHERE id = ? AND user_id = ? AND status = 'active'`,
      )
      .bind(conversationId, userId)
      .first<AiConversationRecord>();
  }

  async history(
    userId: string,
    conversationId: string,
    limit: number,
  ): Promise<AiHistoryMessage[]> {
    const result = await this.db
      .prepare(
        `SELECT role, content
         FROM (
           SELECT role, content, created_at
           FROM ai_messages
           WHERE conversation_id = ? AND user_id = ?
             AND role IN ('user', 'assistant')
           ORDER BY created_at DESC
           LIMIT ?
         )
         ORDER BY created_at`,
      )
      .bind(conversationId, userId, limit)
      .all<AiHistoryMessage>();
    return result.results ?? [];
  }

  async resourceContext(
    userId: string,
    resourceIds: string[],
  ): Promise<string> {
    if (!resourceIds.length) return "";
    const placeholders = resourceIds.map(() => "?").join(", ");
    const result = await this.db
      .prepare(
        `SELECT r.file_name AS fileName, x.extracted_text AS extractedText
         FROM learning_resources r
         INNER JOIN resource_extractions x
           ON x.resource_id = r.id AND x.user_id = r.user_id
         WHERE r.user_id = ?
           AND r.id IN (${placeholders})
           AND r.deleted_at IS NULL
           AND r.processing_status IN ('awaiting_confirmation', 'ready')
           AND x.status IN ('awaiting_confirmation', 'confirmed')
         ORDER BY r.created_at`,
      )
      .bind(userId, ...resourceIds)
      .all<{ fileName: string; extractedText: string | null }>();
    return (result.results ?? [])
      .filter((row) => row.extractedText)
      .map(
        (row) =>
          `RESOURCE ${row.fileName}\n${row.extractedText as string}`,
      )
      .join("\n\n");
  }

  async createConversation(input: {
    id: string;
    userId: string;
    courseId: string;
    topicId: string | null;
    title: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO ai_conversations (
           id, user_id, course_id, topic_id, title, status,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.courseId,
        input.topicId,
        input.title,
        input.now,
        input.now,
      )
      .run();
  }

  async saveExchange(input: {
    userMessageId: string;
    assistantMessageId: string;
    conversationId: string;
    userId: string;
    userMessage: string;
    assistantMessage: string;
    tokenInput: number;
    tokenOutput: number;
    modelKey: string;
    safetyMode: string;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO ai_messages (
             id, conversation_id, user_id, role, content, token_input,
             token_output, model_key, safety_mode, created_at
           ) VALUES (?, ?, ?, 'user', ?, ?, 0, ?, ?, ?)`,
        )
        .bind(
          input.userMessageId,
          input.conversationId,
          input.userId,
          input.userMessage,
          input.tokenInput,
          input.modelKey,
          input.safetyMode,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO ai_messages (
             id, conversation_id, user_id, role, content, token_input,
             token_output, model_key, safety_mode, created_at
           ) VALUES (?, ?, ?, 'assistant', ?, 0, ?, ?, ?, ?)`,
        )
        .bind(
          input.assistantMessageId,
          input.conversationId,
          input.userId,
          input.assistantMessage,
          input.tokenOutput,
          input.modelKey,
          input.safetyMode,
          input.now,
        ),
      this.db
        .prepare(
          `UPDATE ai_conversations SET updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(input.now, input.conversationId, input.userId),
    ]);
  }

  async recordUsage(input: {
    id: string;
    userId: string | null;
    feature: string;
    modelKey: string;
    tokenInput: number;
    tokenOutput: number;
    latencyMs: number;
    success: boolean;
    errorCode: string | null;
    estimatedCostMinorUsd: number;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO ai_usage_logs (
           id, user_id, feature, model_key, token_input, token_output,
           latency_ms, success, error_code, estimated_cost_minor_usd,
           created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.feature,
        input.modelKey,
        input.tokenInput,
        input.tokenOutput,
        input.latencyMs,
        input.success ? 1 : 0,
        input.errorCode,
        input.estimatedCostMinorUsd,
        input.now,
      )
      .run();
  }

  async usageBetween(
    userId: string,
    feature: string,
    from: string,
    to: string,
  ): Promise<{ calls: number; costMinorUsd: number }> {
    const row = await this.db
      .prepare(
        `SELECT
           count(*) AS calls,
           coalesce(sum(estimated_cost_minor_usd), 0) AS costMinorUsd
         FROM ai_usage_logs
         WHERE user_id = ? AND feature = ? AND success = 1
           AND created_at >= ? AND created_at < ?`,
      )
      .bind(userId, feature, from, to)
      .first<{ calls: number; costMinorUsd: number }>();
    return {
      calls: Number(row?.calls ?? 0),
      costMinorUsd: Number(row?.costMinorUsd ?? 0),
    };
  }

  async recordProductEvent(input: {
    id: string;
    userId: string;
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
