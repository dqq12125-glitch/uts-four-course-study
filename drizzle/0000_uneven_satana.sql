CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`assessment_type` text DEFAULT 'other' NOT NULL,
	`due_at` text,
	`weight_percent` integer,
	`estimated_minutes` integer,
	`status` text DEFAULT 'not_started' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "assessments_status_check" CHECK("assessments"."status" in ('not_started', 'in_progress', 'submitted', 'completed', 'overdue')),
	CONSTRAINT "assessments_type_check" CHECK("assessments"."assessment_type" in ('quiz', 'assignment', 'skills_test', 'exam', 'lab', 'project', 'presentation', 'other')),
	CONSTRAINT "assessments_source_type_check" CHECK("assessments"."source_type" in ('manual', 'imported', 'template')),
	CONSTRAINT "assessments_weight_check" CHECK("assessments"."weight_percent" is null or "assessments"."weight_percent" between 0 and 100)
);
--> statement-breakpoint
CREATE INDEX `assessments_user_due_idx` ON `assessments` (`user_id`,`due_at`);--> statement-breakpoint
CREATE INDEX `assessments_course_idx` ON `assessments` (`course_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata_json` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_started_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_rate_limits_expires_idx` ON `auth_rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`created_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_hash_unique` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_idx` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `class_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`session_type` text DEFAULT 'other' NOT NULL,
	`title` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`location` text,
	`map_url` text,
	`start_date` text,
	`end_date` text,
	`recurrence_rule` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "class_sessions_type_check" CHECK("class_sessions"."session_type" in ('lecture', 'tutorial', 'workshop', 'lab', 'practical', 'other')),
	CONSTRAINT "class_sessions_day_check" CHECK("class_sessions"."day_of_week" between 0 and 6)
);
--> statement-breakpoint
CREATE INDEX `class_sessions_user_day_idx` ON `class_sessions` (`user_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `class_sessions_course_idx` ON `class_sessions` (`course_id`);--> statement-breakpoint
CREATE TABLE `course_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`institution_id` text,
	`course_code` text,
	`course_name` text NOT NULL,
	`description` text,
	`default_language` text DEFAULT 'en' NOT NULL,
	`colour_key` text DEFAULT 'ocean' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `course_templates_institution_idx` ON `course_templates` (`institution_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `course_templates_institution_code_unique` ON `course_templates` (`institution_id`,`course_code`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_semester_id` text NOT NULL,
	`course_template_id` text,
	`course_code` text,
	`course_name` text NOT NULL,
	`colour_key` text DEFAULT 'ocean' NOT NULL,
	`instructor_name` text,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_semester_id`) REFERENCES `user_semesters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_template_id`) REFERENCES `course_templates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "courses_source_type_check" CHECK("courses"."source_type" in ('template', 'manual', 'imported'))
);
--> statement-breakpoint
CREATE INDEX `courses_user_semester_idx` ON `courses` (`user_id`,`user_semester_id`);--> statement-breakpoint
CREATE INDEX `courses_user_archived_idx` ON `courses` (`user_id`,`archived_at`);--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`country` text NOT NULL,
	`timezone` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `institutions_name_unique` ON `institutions` (`name`);--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`consumed_at` text,
	`requested_ip_hash` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_link_tokens_hash_unique` ON `magic_link_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `magic_link_tokens_email_idx` ON `magic_link_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `magic_link_tokens_expires_idx` ON `magic_link_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `semesters` (
	`id` text PRIMARY KEY NOT NULL,
	`institution_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_template` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `semesters_institution_code_unique` ON `semesters` (`institution_id`,`code`);--> statement-breakpoint
CREATE INDEX `semesters_dates_idx` ON `semesters` (`start_date`,`end_date`);--> statement-breakpoint
CREATE TABLE `study_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`topic_id` text,
	`assessment_id` text,
	`title` text NOT NULL,
	`description` text,
	`completion_criteria` text NOT NULL,
	`reason` text NOT NULL,
	`task_type` text DEFAULT 'custom' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`priority_score` integer DEFAULT 0 NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`scheduled_for` text NOT NULL,
	`due_at` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`generated_by` text DEFAULT 'rule' NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "study_tasks_type_check" CHECK("study_tasks"."task_type" in ('preview', 'review', 'practice', 'assessment', 'revision', 'retest', 'reading', 'custom')),
	CONSTRAINT "study_tasks_priority_check" CHECK("study_tasks"."priority" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "study_tasks_status_check" CHECK("study_tasks"."status" in ('queued', 'active', 'completed', 'skipped', 'overdue')),
	CONSTRAINT "study_tasks_generated_by_check" CHECK("study_tasks"."generated_by" in ('user', 'rule', 'ai', 'template'))
);
--> statement-breakpoint
CREATE INDEX `study_tasks_user_schedule_idx` ON `study_tasks` (`user_id`,`scheduled_for`,`status`);--> statement-breakpoint
CREATE INDEX `study_tasks_course_idx` ON `study_tasks` (`course_id`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`week_number` integer,
	`sequence_number` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topics_user_course_idx` ON `topics` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event_name` text NOT NULL,
	`event_category` text NOT NULL,
	`properties_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `usage_events_user_created_idx` ON `usage_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `usage_events_name_created_idx` ON `usage_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_semesters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`institution_id` text,
	`institution_name` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "user_semesters_status_check" CHECK("user_semesters"."status" in ('draft', 'active', 'completed', 'archived'))
);
--> statement-breakpoint
CREATE INDEX `user_semesters_user_status_idx` ON `user_semesters` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_study_minutes` integer DEFAULT 60 NOT NULL,
	`preferred_study_start_time` text,
	`week_starts_on` integer DEFAULT 1 NOT NULL,
	`reminder_enabled` integer DEFAULT true NOT NULL,
	`academic_integrity_mode` integer DEFAULT true NOT NULL,
	`ai_explanation_language` text DEFAULT 'zh-CN' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_settings_daily_minutes_check" CHECK("user_settings"."daily_study_minutes" between 15 and 720),
	CONSTRAINT "user_settings_week_starts_on_check" CHECK("user_settings"."week_starts_on" between 0 and 6)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified_at` text,
	`display_name` text,
	`preferred_language` text DEFAULT 'zh-CN' NOT NULL,
	`timezone` text DEFAULT 'Australia/Sydney' NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`onboarding_completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "users_preferred_language_check" CHECK("users"."preferred_language" in ('zh-CN', 'en')),
	CONSTRAINT "users_role_check" CHECK("users"."role" in ('student', 'admin')),
	CONSTRAINT "users_status_check" CHECK("users"."status" in ('active', 'suspended', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
INSERT OR IGNORE INTO `institutions` (
	`id`,
	`name`,
	`short_name`,
	`country`,
	`timezone`,
	`is_active`,
	`created_at`,
	`updated_at`
) VALUES (
	'inst_uts',
	'University of Technology Sydney',
	'UTS',
	'Australia',
	'Australia/Sydney',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);--> statement-breakpoint
INSERT OR IGNORE INTO `semesters` (
	`id`,
	`institution_id`,
	`name`,
	`code`,
	`start_date`,
	`end_date`,
	`is_template`,
	`created_at`,
	`updated_at`
) VALUES (
	'semester_uts_spring_2026',
	'inst_uts',
	'Spring 2026',
	'2026-SPRING',
	'2026-08-03',
	'2026-11-29',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);--> statement-breakpoint
INSERT OR IGNORE INTO `course_templates` (
	`id`,
	`institution_id`,
	`course_code`,
	`course_name`,
	`description`,
	`default_language`,
	`is_active`,
	`created_at`,
	`updated_at`
) VALUES (
	'template_uts_33130',
	'inst_uts',
	'33130',
	'Mathematics 1',
	'Optional starter template. Students may create any course instead.',
	'en',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);--> statement-breakpoint
INSERT OR IGNORE INTO `course_templates` (
	`id`,
	`institution_id`,
	`course_code`,
	`course_name`,
	`description`,
	`default_language`,
	`is_active`,
	`created_at`,
	`updated_at`
) VALUES (
	'template_uts_68037',
	'inst_uts',
	'68037',
	'Physical Modelling',
	'Optional starter template. Students may create any course instead.',
	'en',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);--> statement-breakpoint
INSERT OR IGNORE INTO `course_templates` (
	`id`,
	`institution_id`,
	`course_code`,
	`course_name`,
	`description`,
	`default_language`,
	`is_active`,
	`created_at`,
	`updated_at`
) VALUES (
	'template_uts_48430',
	'inst_uts',
	'48430',
	'Fundamentals of C Programming',
	'Optional starter template. Students may create any course instead.',
	'en',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);--> statement-breakpoint
INSERT OR IGNORE INTO `course_templates` (
	`id`,
	`institution_id`,
	`course_code`,
	`course_name`,
	`description`,
	`default_language`,
	`is_active`,
	`created_at`,
	`updated_at`
) VALUES (
	'template_uts_48510',
	'inst_uts',
	'48510',
	'Introduction to Electrical and Electronic Engineering',
	'Optional starter template. Students may create any course instead.',
	'en',
	1,
	'2026-07-30T00:00:00.000Z',
	'2026-07-30T00:00:00.000Z'
);
