import type { D1DatabaseLike } from "./types.ts";

export interface CourseTemplateRecord {
  id: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionShortName: string | null;
  courseCode: string | null;
  courseName: string;
  description: string | null;
  defaultLanguage: "zh-CN" | "en";
  colourKey: string;
}

export interface CourseRecord {
  id: string;
  userSemesterId: string;
  courseTemplateId: string | null;
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  instructorName: string | null;
  sourceType: "template" | "manual" | "imported";
  assessmentCount?: number;
}

export interface AssessmentRecord {
  id: string;
  courseId: string;
  title: string;
  assessmentType: string;
  dueAt: string | null;
  weightPercent: number | null;
  estimatedMinutes: number | null;
  status: string;
  notes: string | null;
}

export interface UserSemesterRecord {
  id: string;
  institutionId: string | null;
  institutionName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "completed" | "archived";
}

export interface OnboardingWrite {
  userId: string;
  displayName: string | null;
  language: "zh-CN" | "en";
  timezone: string;
  dailyStudyMinutes: number;
  semester: {
    id: string;
    institutionId: string | null;
    institutionName: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  courses: Array<{
    id: string;
    courseTemplateId: string | null;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    instructorName: string | null;
    sourceType: "template" | "manual";
    classSessions: Array<{
      id: string;
      sessionType: string;
      title: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location: string | null;
      mapUrl: string | null;
    }>;
    assessments: Array<{
      id: string;
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      notes: string | null;
    }>;
  }>;
  tasks: Array<{
    id: string;
    courseId: string;
    assessmentId: string | null;
    title: string;
    description: string;
    completionCriteria: string;
    reason: string;
    taskType: string;
    priority: string;
    priorityScore: number;
    estimatedMinutes: number;
    scheduledFor: string;
    dueAt: string | null;
  }>;
  now: string;
}

export class LearningRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async listCourseTemplates(): Promise<CourseTemplateRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           ct.id,
           ct.institution_id AS institutionId,
           i.name AS institutionName,
           i.short_name AS institutionShortName,
           ct.course_code AS courseCode,
           ct.course_name AS courseName,
           ct.description,
           ct.default_language AS defaultLanguage,
           ct.colour_key AS colourKey
         FROM course_templates ct
         LEFT JOIN institutions i ON i.id = ct.institution_id
         WHERE ct.is_active = 1
         ORDER BY i.short_name, ct.course_code, ct.course_name`,
      )
      .all<CourseTemplateRecord>();
    return result.results ?? [];
  }

  async institutionExists(institutionId: string): Promise<boolean> {
    const row = await this.db
      .prepare(
        `SELECT id
         FROM institutions
         WHERE id = ? AND is_active = 1`,
      )
      .bind(institutionId)
      .first<{ id: string }>();
    return row !== null;
  }

  async findCourseTemplate(
    templateId: string,
  ): Promise<CourseTemplateRecord | null> {
    return this.db
      .prepare(
        `SELECT
           ct.id,
           ct.institution_id AS institutionId,
           i.name AS institutionName,
           i.short_name AS institutionShortName,
           ct.course_code AS courseCode,
           ct.course_name AS courseName,
           ct.description,
           ct.default_language AS defaultLanguage,
           ct.colour_key AS colourKey
         FROM course_templates ct
         LEFT JOIN institutions i ON i.id = ct.institution_id
         WHERE ct.id = ? AND ct.is_active = 1`,
      )
      .bind(templateId)
      .first<CourseTemplateRecord>();
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const row = await this.db
      .prepare(
        `SELECT onboarding_completed_at
         FROM users
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(userId)
      .first<{ onboarding_completed_at: string | null }>();
    return Boolean(row?.onboarding_completed_at);
  }

  async completeOnboarding(input: OnboardingWrite): Promise<void> {
    const statements = [
      this.db
        .prepare(
          `INSERT INTO user_semesters (
             id, user_id, institution_id, institution_name, name,
             start_date, end_date, status, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          input.semester.id,
          input.userId,
          input.semester.institutionId,
          input.semester.institutionName,
          input.semester.name,
          input.semester.startDate,
          input.semester.endDate,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `UPDATE user_settings
           SET daily_study_minutes = ?,
               ai_explanation_language = ?,
               updated_at = ?
           WHERE user_id = ?`,
        )
        .bind(
          input.dailyStudyMinutes,
          input.language,
          input.now,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE users
           SET display_name = ?,
               preferred_language = ?,
               timezone = ?,
               onboarding_completed_at = ?,
               updated_at = ?
           WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
        )
        .bind(
          input.displayName,
          input.language,
          input.timezone,
          input.now,
          input.now,
          input.userId,
        ),
    ];

    for (const course of input.courses) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO courses (
               id, user_id, user_semester_id, course_template_id,
               course_code, course_name, colour_key, instructor_name,
               source_type, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            course.id,
            input.userId,
            input.semester.id,
            course.courseTemplateId,
            course.courseCode,
            course.courseName,
            course.colourKey,
            course.instructorName,
            course.sourceType,
            input.now,
            input.now,
          ),
      );
      for (const session of course.classSessions) {
        statements.push(
          this.db
            .prepare(
              `INSERT INTO class_sessions (
                 id, course_id, user_id, session_type, title, day_of_week,
                 start_time, end_time, location, map_url, start_date,
                 end_date, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              session.id,
              course.id,
              input.userId,
              session.sessionType,
              session.title,
              session.dayOfWeek,
              session.startTime,
              session.endTime,
              session.location,
              session.mapUrl,
              input.semester.startDate,
              input.semester.endDate,
              input.now,
              input.now,
            ),
        );
      }
      for (const assessment of course.assessments) {
        statements.push(
          this.db
            .prepare(
              `INSERT INTO assessments (
                 id, course_id, user_id, title, assessment_type, due_at,
                 weight_percent, estimated_minutes, status, source_type,
                 notes, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_started', 'manual',
                 ?, ?, ?)`,
            )
            .bind(
              assessment.id,
              course.id,
              input.userId,
              assessment.title,
              assessment.assessmentType,
              assessment.dueAt,
              assessment.weightPercent,
              assessment.estimatedMinutes,
              assessment.notes,
              input.now,
              input.now,
            ),
        );
      }
    }

    for (const task of input.tasks) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO study_tasks (
               id, user_id, course_id, assessment_id, title, description,
               completion_criteria, reason, task_type, priority,
               priority_score, estimated_minutes, scheduled_for, due_at,
               status, generated_by, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               'queued', 'rule', ?, ?)`,
          )
          .bind(
            task.id,
            input.userId,
            task.courseId,
            task.assessmentId,
            task.title,
            task.description,
            task.completionCriteria,
            task.reason,
            task.taskType,
            task.priority,
            task.priorityScore,
            task.estimatedMinutes,
            task.scheduledFor,
            task.dueAt,
            input.now,
            input.now,
          ),
      );
    }

    statements.push(
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json, created_at
           ) VALUES (?, ?, 'onboarding_completed', 'activation', ?, ?)`,
        )
        .bind(
          `event_${crypto.randomUUID().replaceAll("-", "")}`,
          input.userId,
          JSON.stringify({
            courseCount: input.courses.length,
            sourceTypes: input.courses.map((course) => course.sourceType),
          }),
          input.now,
        ),
    );
    statements.push(
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json, created_at
           ) VALUES (?, ?, 'first_plan_generated', 'activation', ?, ?)`,
        )
        .bind(
          `event_${crypto.randomUUID().replaceAll("-", "")}`,
          input.userId,
          JSON.stringify({ taskCount: input.tasks.length }),
          input.now,
        ),
    );

    await this.db.batch(statements);
  }

  async listCourses(userId: string): Promise<CourseRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           c.id,
           c.user_semester_id AS userSemesterId,
           c.course_template_id AS courseTemplateId,
           c.course_code AS courseCode,
           c.course_name AS courseName,
           c.colour_key AS colourKey,
           c.instructor_name AS instructorName,
           c.source_type AS sourceType,
           COUNT(a.id) AS assessmentCount
         FROM courses c
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         LEFT JOIN assessments a
           ON a.course_id = c.id AND a.user_id = ?
         WHERE c.user_id = ? AND c.archived_at IS NULL
         GROUP BY c.id
         ORDER BY c.created_at`,
      )
      .bind(userId, userId, userId)
      .all<CourseRecord>();
    return result.results ?? [];
  }

  async activeSemesterId(userId: string): Promise<string | null> {
    const row = await this.db
      .prepare(
        `SELECT id
         FROM user_semesters
         WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .bind(userId)
      .first<{ id: string }>();
    return row?.id ?? null;
  }

  async activeSemesterEndDate(userId: string): Promise<string | null> {
    const row = await this.db
      .prepare(
        `SELECT end_date AS endDate
         FROM user_semesters
         WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .bind(userId)
      .first<{ endDate: string }>();
    return row?.endDate ?? null;
  }

  async listUserSemesters(userId: string): Promise<UserSemesterRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id,
           institution_id AS institutionId,
           institution_name AS institutionName,
           name,
           start_date AS startDate,
           end_date AS endDate,
           status
         FROM user_semesters
         WHERE user_id = ?
         ORDER BY
           CASE status
             WHEN 'active' THEN 0
             WHEN 'draft' THEN 1
             WHEN 'completed' THEN 2
             ELSE 3
           END,
           start_date DESC`,
      )
      .bind(userId)
      .all<UserSemesterRecord>();
    return result.results ?? [];
  }

  async findUserSemester(
    userId: string,
    semesterId: string,
  ): Promise<UserSemesterRecord | null> {
    return this.db
      .prepare(
        `SELECT
           id,
           institution_id AS institutionId,
           institution_name AS institutionName,
           name,
           start_date AS startDate,
           end_date AS endDate,
           status
         FROM user_semesters
         WHERE id = ? AND user_id = ?`,
      )
      .bind(semesterId, userId)
      .first<UserSemesterRecord>();
  }

  async createUserSemester(
    userId: string,
    input: {
      id: string;
      institutionId: string | null;
      institutionName: string;
      name: string;
      startDate: string;
      endDate: string;
      status: "draft" | "active";
      now: string;
    },
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_semesters (
           id, user_id, institution_id, institution_name, name,
           start_date, end_date, status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        userId,
        input.institutionId,
        input.institutionName,
        input.name,
        input.startDate,
        input.endDate,
        input.status,
        input.now,
        input.now,
      )
      .run();
  }

  async updateUserSemester(
    userId: string,
    semesterId: string,
    input: {
      institutionId: string | null;
      institutionName: string;
      name: string;
      startDate: string;
      endDate: string;
      status: "draft" | "active" | "completed";
      now: string;
    },
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE user_semesters
         SET institution_id = ?,
             institution_name = ?,
             name = ?,
             start_date = ?,
             end_date = ?,
             status = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ? AND status != 'archived'`,
      )
      .bind(
        input.institutionId,
        input.institutionName,
        input.name,
        input.startDate,
        input.endDate,
        input.status,
        input.now,
        semesterId,
        userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async archiveUserSemester(
    userId: string,
    semesterId: string,
    now: string,
  ): Promise<boolean> {
    const results = await this.db.batch([
      this.db
        .prepare(
          `UPDATE courses
           SET archived_at = COALESCE(archived_at, ?), updated_at = ?
           WHERE user_id = ? AND user_semester_id = ?`,
        )
        .bind(now, now, userId, semesterId),
      this.db
        .prepare(
          `UPDATE user_semesters
           SET status = 'archived', updated_at = ?
           WHERE id = ? AND user_id = ? AND status != 'archived'`,
        )
        .bind(now, semesterId, userId),
    ]);
    return Number(results[1]?.meta.changes ?? 0) > 0;
  }

  async activeCourseCount(userId: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM courses c
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         WHERE c.user_id = ? AND c.archived_at IS NULL`,
      )
      .bind(userId, userId)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async dailyStudyMinutes(userId: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT daily_study_minutes AS dailyStudyMinutes
         FROM user_settings
         WHERE user_id = ?`,
      )
      .bind(userId)
      .first<{ dailyStudyMinutes: number }>();
    return Number(row?.dailyStudyMinutes ?? 60);
  }

  async createCourse(
    userId: string,
    input: {
      id: string;
      userSemesterId: string;
      courseTemplateId: string | null;
      courseCode: string | null;
      courseName: string;
      colourKey: string;
      instructorName: string | null;
      sourceType: "template" | "manual";
      now: string;
      starterTask: {
        id: string;
        title: string;
        description: string;
        completionCriteria: string;
        reason: string;
        taskType: string;
        priority: string;
        priorityScore: number;
        estimatedMinutes: number;
        scheduledFor: string;
      };
    },
  ): Promise<boolean> {
    const results = await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO courses (
             id, user_id, user_semester_id, course_template_id,
             course_code, course_name, colour_key, instructor_name,
             source_type, created_at, updated_at
           )
           SELECT ?, ?, us.id, ?, ?, ?, ?, ?, ?, ?, ?
           FROM user_semesters us
           WHERE us.id = ? AND us.user_id = ? AND us.status = 'active'`,
        )
        .bind(
          input.id,
          userId,
          input.courseTemplateId,
          input.courseCode,
          input.courseName,
          input.colourKey,
          input.instructorName,
          input.sourceType,
          input.now,
          input.now,
          input.userSemesterId,
          userId,
        ),
      this.db
        .prepare(
          `INSERT INTO study_tasks (
             id, user_id, course_id, title, description,
             completion_criteria, reason, task_type, priority,
             priority_score, estimated_minutes, scheduled_for,
             status, generated_by, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             'queued', 'rule', ?, ?)`,
        )
        .bind(
          input.starterTask.id,
          userId,
          input.id,
          input.starterTask.title,
          input.starterTask.description,
          input.starterTask.completionCriteria,
          input.starterTask.reason,
          input.starterTask.taskType,
          input.starterTask.priority,
          input.starterTask.priorityScore,
          input.starterTask.estimatedMinutes,
          input.starterTask.scheduledFor,
          input.now,
          input.now,
        ),
    ]);
    return Number(results[0]?.meta.changes ?? 0) > 0;
  }

  async findCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseRecord | null> {
    return this.db
      .prepare(
        `SELECT
           id,
           user_semester_id AS userSemesterId,
           course_template_id AS courseTemplateId,
           course_code AS courseCode,
           course_name AS courseName,
           colour_key AS colourKey,
           instructor_name AS instructorName,
           source_type AS sourceType
         FROM courses
         WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      )
      .bind(courseId, userId)
      .first<CourseRecord>();
  }

  async updateCourse(
    userId: string,
    courseId: string,
    input: {
      courseCode: string | null;
      courseName: string;
      colourKey: string;
      instructorName: string | null;
      now: string;
    },
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE courses
         SET course_code = ?,
             course_name = ?,
             colour_key = ?,
             instructor_name = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      )
      .bind(
        input.courseCode,
        input.courseName,
        input.colourKey,
        input.instructorName,
        input.now,
        courseId,
        userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async archiveCourse(
    userId: string,
    courseId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE courses
         SET archived_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      )
      .bind(now, now, courseId, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async listAssessments(
    userId: string,
    courseId: string,
  ): Promise<AssessmentRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id,
           course_id AS courseId,
           title,
           assessment_type AS assessmentType,
           due_at AS dueAt,
           weight_percent AS weightPercent,
           estimated_minutes AS estimatedMinutes,
           status,
           notes
         FROM assessments
         WHERE user_id = ? AND course_id = ?
         ORDER BY due_at IS NULL, due_at`,
      )
      .bind(userId, courseId)
      .all<AssessmentRecord>();
    return result.results ?? [];
  }

  async createAssessment(
    userId: string,
    input: {
      id: string;
      courseId: string;
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      notes: string | null;
      now: string;
    },
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO assessments (
           id, course_id, user_id, title, assessment_type, due_at,
           weight_percent, estimated_minutes, status, source_type,
           notes, created_at, updated_at
         )
         SELECT ?, c.id, ?, ?, ?, ?, ?, ?, 'not_started', 'manual', ?, ?, ?
         FROM courses c
         WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL`,
      )
      .bind(
        input.id,
        userId,
        input.title,
        input.assessmentType,
        input.dueAt,
        input.weightPercent,
        input.estimatedMinutes,
        input.notes,
        input.now,
        input.now,
        input.courseId,
        userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async updateAssessment(
    userId: string,
    assessmentId: string,
    input: {
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      status: string;
      notes: string | null;
      now: string;
    },
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE assessments
         SET title = ?,
             assessment_type = ?,
             due_at = ?,
             weight_percent = ?,
             estimated_minutes = ?,
             status = ?,
             notes = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        input.title,
        input.assessmentType,
        input.dueAt,
        input.weightPercent,
        input.estimatedMinutes,
        input.status,
        input.notes,
        input.now,
        assessmentId,
        userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async deleteAssessment(
    userId: string,
    assessmentId: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM assessments
         WHERE id = ? AND user_id = ?`,
      )
      .bind(assessmentId, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async today(
    userId: string,
    scheduledFor: string,
    dayOfWeek: number,
    now = new Date().toISOString(),
  ): Promise<{
    semester: {
      name: string;
      startDate: string;
      endDate: string;
    } | null;
    settings: { dailyStudyMinutes: number };
    tasks: Array<{
      id: string;
      courseId: string | null;
      topicId: string | null;
      courseCode: string | null;
      courseName: string | null;
      title: string;
      description: string | null;
      completionCriteria: string;
      reason: string;
      priority: string;
      estimatedMinutes: number;
      status: string;
      taskType: string;
      dueAt: string | null;
    }>;
    assessments: Array<{
      id: string;
      courseCode: string | null;
      courseName: string;
      title: string;
      dueAt: string | null;
    }>;
    classSessions: Array<{
      id: string;
      courseCode: string | null;
      courseName: string;
      sessionType: string;
      title: string;
      startTime: string;
      endTime: string;
      location: string | null;
      mapUrl: string | null;
    }>;
  }> {
    const [
      semester,
      settings,
      taskRows,
      assessmentRows,
      classSessionRows,
    ] = await Promise.all([
      this.db
        .prepare(
          `SELECT name, start_date AS startDate, end_date AS endDate
           FROM user_semesters
           WHERE user_id = ? AND status = 'active'
           ORDER BY created_at DESC LIMIT 1`,
        )
        .bind(userId)
        .first<{ name: string; startDate: string; endDate: string }>(),
      this.db
        .prepare(
          `SELECT daily_study_minutes AS dailyStudyMinutes
           FROM user_settings WHERE user_id = ?`,
        )
        .bind(userId)
        .first<{ dailyStudyMinutes: number }>(),
      this.db
        .prepare(
          `SELECT
             t.id,
             t.course_id AS courseId,
             t.topic_id AS topicId,
             c.course_code AS courseCode,
             c.course_name AS courseName,
             t.title,
             t.description,
             t.completion_criteria AS completionCriteria,
             t.reason,
             t.priority,
             t.estimated_minutes AS estimatedMinutes,
             t.status,
             t.task_type AS taskType,
             t.due_at AS dueAt
           FROM study_tasks t
           LEFT JOIN courses c
             ON c.id = t.course_id
               AND c.user_id = ?
               AND c.archived_at IS NULL
           LEFT JOIN user_semesters task_semester
             ON task_semester.id = c.user_semester_id
               AND task_semester.user_id = ?
               AND task_semester.status = 'active'
           WHERE t.user_id = ?
             AND (
               (
                 t.scheduled_for = ?
                 AND t.status IN ('queued', 'active', 'completed')
               )
               OR (
                 t.task_type = 'retest'
                 AND t.due_at IS NOT NULL
                 AND t.due_at <= ?
                 AND t.status IN ('queued', 'active', 'overdue')
               )
             )
             AND (
               t.course_id IS NULL
               OR (c.id IS NOT NULL AND task_semester.id IS NOT NULL)
             )
           ORDER BY
             CASE
               WHEN t.status = 'active' THEN 0
               WHEN t.task_type = 'retest' AND t.due_at <= ? THEN 1
               WHEN t.status = 'queued' THEN 2
               ELSE 3
             END,
             t.priority_score DESC,
             t.created_at`,
        )
        .bind(userId, userId, userId, scheduledFor, now, now)
        .all<{
          id: string;
          courseId: string | null;
          topicId: string | null;
          courseCode: string | null;
          courseName: string | null;
          title: string;
          description: string | null;
          completionCriteria: string;
          reason: string;
          priority: string;
          estimatedMinutes: number;
          status: string;
          taskType: string;
          dueAt: string | null;
        }>(),
      this.db
        .prepare(
          `SELECT
             a.id,
             c.course_code AS courseCode,
             c.course_name AS courseName,
             a.title,
             a.due_at AS dueAt
           FROM assessments a
           INNER JOIN courses c
             ON c.id = a.course_id
               AND c.user_id = ?
               AND c.archived_at IS NULL
           INNER JOIN user_semesters assessment_semester
             ON assessment_semester.id = c.user_semester_id
               AND assessment_semester.user_id = ?
               AND assessment_semester.status = 'active'
           WHERE a.user_id = ?
             AND a.status NOT IN ('completed', 'submitted')
           ORDER BY a.due_at IS NULL, a.due_at
           LIMIT 3`,
        )
        .bind(userId, userId, userId)
        .all<{
          id: string;
          courseCode: string | null;
          courseName: string;
          title: string;
          dueAt: string | null;
        }>(),
      this.db
        .prepare(
          `SELECT
             cs.id,
             c.course_code AS courseCode,
             c.course_name AS courseName,
             cs.session_type AS sessionType,
             cs.title,
             cs.start_time AS startTime,
             cs.end_time AS endTime,
             cs.location,
             cs.map_url AS mapUrl
           FROM class_sessions cs
           INNER JOIN courses c
             ON c.id = cs.course_id
               AND c.user_id = ?
               AND c.archived_at IS NULL
           INNER JOIN user_semesters class_semester
             ON class_semester.id = c.user_semester_id
               AND class_semester.user_id = ?
               AND class_semester.status = 'active'
           WHERE cs.user_id = ?
             AND cs.day_of_week = ?
             AND (cs.start_date IS NULL OR cs.start_date <= ?)
             AND (cs.end_date IS NULL OR cs.end_date >= ?)
           ORDER BY cs.start_time`,
        )
        .bind(
          userId,
          userId,
          userId,
          dayOfWeek,
          scheduledFor,
          scheduledFor,
        )
        .all<{
          id: string;
          courseCode: string | null;
          courseName: string;
          sessionType: string;
          title: string;
          startTime: string;
          endTime: string;
          location: string | null;
          mapUrl: string | null;
        }>(),
    ]);

    return {
      semester,
      settings: settings ?? { dailyStudyMinutes: 60 },
      tasks: taskRows.results ?? [],
      assessments: assessmentRows.results ?? [],
      classSessions: classSessionRows.results ?? [],
    };
  }

  async updateTaskStatus(
    userId: string,
    taskId: string,
    status: "active" | "completed" | "skipped",
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE study_tasks
         SET status = ?,
             completed_at = CASE WHEN ? = 'completed' THEN ? ELSE NULL END,
             updated_at = ?
         WHERE id = ? AND user_id = ?
           AND status IN ('queued', 'active')`,
      )
      .bind(status, status, now, now, taskId, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }
}
