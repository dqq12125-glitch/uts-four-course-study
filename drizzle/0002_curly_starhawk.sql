CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`study_task_id` text,
	`planned_minutes` integer NOT NULL,
	`actual_seconds` integer,
	`started_at` text NOT NULL,
	`ended_at` text,
	`completion_status` text DEFAULT 'active' NOT NULL,
	`difficulty` integer,
	`needs_more_practice` integer DEFAULT false NOT NULL,
	`confidence_after` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`study_task_id`) REFERENCES `study_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "focus_sessions_planned_minutes_check" CHECK("focus_sessions"."planned_minutes" between 5 and 180),
	CONSTRAINT "focus_sessions_actual_seconds_check" CHECK("focus_sessions"."actual_seconds" is null or "focus_sessions"."actual_seconds" between 0 and 86400),
	CONSTRAINT "focus_sessions_status_check" CHECK("focus_sessions"."completion_status" in ('active', 'completed', 'partial', 'abandoned')),
	CONSTRAINT "focus_sessions_difficulty_check" CHECK("focus_sessions"."difficulty" is null or "focus_sessions"."difficulty" between 1 and 5),
	CONSTRAINT "focus_sessions_confidence_check" CHECK("focus_sessions"."confidence_after" is null or "focus_sessions"."confidence_after" between 1 and 5)
);
--> statement-breakpoint
CREATE INDEX `focus_sessions_user_started_idx` ON `focus_sessions` (`user_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `focus_sessions_task_idx` ON `focus_sessions` (`study_task_id`);--> statement-breakpoint
CREATE TABLE `mastery_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`mastery_score` integer DEFAULT 0 NOT NULL,
	`confidence_score` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` text,
	`last_correct_at` text,
	`next_review_at` text,
	`review_interval_hours` integer DEFAULT 0 NOT NULL,
	`consecutive_correct` integer DEFAULT 0 NOT NULL,
	`consecutive_incorrect` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "mastery_records_score_check" CHECK("mastery_records"."mastery_score" between 0 and 100),
	CONSTRAINT "mastery_records_confidence_check" CHECK("mastery_records"."confidence_score" between 0 and 100),
	CONSTRAINT "mastery_records_interval_check" CHECK("mastery_records"."review_interval_hours" between 0 and 8760),
	CONSTRAINT "mastery_records_streak_check" CHECK("mastery_records"."consecutive_correct" >= 0 and "mastery_records"."consecutive_incorrect" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mastery_records_user_topic_unique` ON `mastery_records` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE INDEX `mastery_records_user_course_idx` ON `mastery_records` (`user_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `mastery_records_review_queue_idx` ON `mastery_records` (`user_id`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `practice_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`practice_question_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`practice_session_id` text NOT NULL,
	`study_task_id` text,
	`answer` text NOT NULL,
	`is_correct` integer NOT NULL,
	`score` integer NOT NULL,
	`confidence_before` integer,
	`confidence_after` integer,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`time_spent_seconds` integer NOT NULL,
	`error_type` text DEFAULT 'unknown' NOT NULL,
	`attempted_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_session_id`) REFERENCES `practice_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`study_task_id`) REFERENCES `study_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "practice_attempts_score_check" CHECK("practice_attempts"."score" between 0 and 100),
	CONSTRAINT "practice_attempts_confidence_before_check" CHECK("practice_attempts"."confidence_before" is null or "practice_attempts"."confidence_before" between 1 and 5),
	CONSTRAINT "practice_attempts_confidence_after_check" CHECK("practice_attempts"."confidence_after" is null or "practice_attempts"."confidence_after" between 1 and 5),
	CONSTRAINT "practice_attempts_hints_check" CHECK("practice_attempts"."hints_used" between 0 and 3),
	CONSTRAINT "practice_attempts_time_check" CHECK("practice_attempts"."time_spent_seconds" between 0 and 86400),
	CONSTRAINT "practice_attempts_error_type_check" CHECK("practice_attempts"."error_type" in ('concept', 'formula', 'algebra', 'units', 'sign', 'interpretation', 'syntax', 'logic', 'careless', 'unknown'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `practice_attempts_session_unique` ON `practice_attempts` (`practice_session_id`);--> statement-breakpoint
CREATE INDEX `practice_attempts_user_topic_idx` ON `practice_attempts` (`user_id`,`topic_id`,`attempted_at`);--> statement-breakpoint
CREATE INDEX `practice_attempts_question_idx` ON `practice_attempts` (`practice_question_id`);--> statement-breakpoint
CREATE TABLE `practice_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`course_template_id` text,
	`course_id` text,
	`topic_id` text,
	`owner_user_id` text,
	`question_type` text DEFAULT 'single_choice' NOT NULL,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text,
	`solution` text NOT NULL,
	`hint_1` text,
	`hint_2` text,
	`hint_3` text,
	`explanation` text NOT NULL,
	`language` text DEFAULT 'zh-CN' NOT NULL,
	`source_type` text DEFAULT 'user_generated' NOT NULL,
	`review_status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_template_id`) REFERENCES `course_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "practice_questions_type_check" CHECK("practice_questions"."question_type" in ('single_choice', 'multiple_choice', 'short_answer', 'numeric')),
	CONSTRAINT "practice_questions_difficulty_check" CHECK("practice_questions"."difficulty" between 1 and 5),
	CONSTRAINT "practice_questions_language_check" CHECK("practice_questions"."language" in ('zh-CN', 'en')),
	CONSTRAINT "practice_questions_source_check" CHECK("practice_questions"."source_type" in ('original', 'ai_generated', 'user_generated')),
	CONSTRAINT "practice_questions_review_check" CHECK("practice_questions"."review_status" in ('draft', 'reviewed', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `practice_questions_owner_course_idx` ON `practice_questions` (`owner_user_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `practice_questions_topic_idx` ON `practice_questions` (`topic_id`);--> statement-breakpoint
CREATE INDEX `practice_questions_public_template_idx` ON `practice_questions` (`course_template_id`,`review_status`);--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`practice_question_id` text NOT NULL,
	`study_task_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`confidence_before` integer,
	`started_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`study_task_id`) REFERENCES `study_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "practice_sessions_status_check" CHECK("practice_sessions"."status" in ('active', 'completed', 'abandoned')),
	CONSTRAINT "practice_sessions_hints_check" CHECK("practice_sessions"."hints_used" between 0 and 3),
	CONSTRAINT "practice_sessions_confidence_check" CHECK("practice_sessions"."confidence_before" is null or "practice_sessions"."confidence_before" between 1 and 5)
);
--> statement-breakpoint
CREATE INDEX `practice_sessions_user_status_idx` ON `practice_sessions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `practice_sessions_question_idx` ON `practice_sessions` (`practice_question_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `study_tasks_open_retest_topic_unique` ON `study_tasks` (`user_id`,`topic_id`) WHERE "study_tasks"."task_type" = 'retest' and "study_tasks"."status" in ('queued', 'active', 'overdue');--> statement-breakpoint
CREATE UNIQUE INDEX `topics_user_course_title_unique` ON `topics` (`user_id`,`course_id`,`title`);