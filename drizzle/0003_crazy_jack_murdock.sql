PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`practice_question_id` text NOT NULL,
	`study_task_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`incorrect_attempts` integer DEFAULT 0 NOT NULL,
	`confidence_before` integer,
	`started_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`study_task_id`) REFERENCES `study_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "practice_sessions_status_check" CHECK("__new_practice_sessions"."status" in ('active', 'completed', 'abandoned')),
	CONSTRAINT "practice_sessions_hints_check" CHECK("__new_practice_sessions"."hints_used" between 0 and 3),
	CONSTRAINT "practice_sessions_incorrect_attempts_check" CHECK("__new_practice_sessions"."incorrect_attempts" between 0 and 3),
	CONSTRAINT "practice_sessions_confidence_check" CHECK("__new_practice_sessions"."confidence_before" is null or "__new_practice_sessions"."confidence_before" between 1 and 5)
);
--> statement-breakpoint
INSERT INTO `__new_practice_sessions`("id", "user_id", "course_id", "topic_id", "practice_question_id", "study_task_id", "status", "hints_used", "incorrect_attempts", "confidence_before", "started_at", "completed_at", "created_at") SELECT "id", "user_id", "course_id", "topic_id", "practice_question_id", "study_task_id", "status", "hints_used", 0, "confidence_before", "started_at", "completed_at", "created_at" FROM `practice_sessions`;--> statement-breakpoint
DROP TABLE `practice_sessions`;--> statement-breakpoint
ALTER TABLE `__new_practice_sessions` RENAME TO `practice_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `practice_sessions_user_status_idx` ON `practice_sessions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `practice_sessions_question_idx` ON `practice_sessions` (`practice_question_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `practice_sessions_one_active_user_unique` ON `practice_sessions` (`user_id`) WHERE "practice_sessions"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX `focus_sessions_one_active_user_unique` ON `focus_sessions` (`user_id`) WHERE "focus_sessions"."completion_status" = 'active' and "focus_sessions"."ended_at" is null;
