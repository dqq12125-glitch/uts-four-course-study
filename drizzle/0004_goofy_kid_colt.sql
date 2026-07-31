PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_practice_attempts` (
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
	`incorrect_attempts` integer DEFAULT 0 NOT NULL,
	`time_spent_seconds` integer NOT NULL,
	`error_type` text DEFAULT 'unknown' NOT NULL,
	`attempted_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`practice_session_id`) REFERENCES `practice_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`study_task_id`) REFERENCES `study_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "practice_attempts_score_check" CHECK("__new_practice_attempts"."score" between 0 and 100),
	CONSTRAINT "practice_attempts_confidence_before_check" CHECK("__new_practice_attempts"."confidence_before" is null or "__new_practice_attempts"."confidence_before" between 1 and 5),
	CONSTRAINT "practice_attempts_confidence_after_check" CHECK("__new_practice_attempts"."confidence_after" is null or "__new_practice_attempts"."confidence_after" between 1 and 5),
	CONSTRAINT "practice_attempts_hints_check" CHECK("__new_practice_attempts"."hints_used" between 0 and 3),
	CONSTRAINT "practice_attempts_incorrect_attempts_check" CHECK("__new_practice_attempts"."incorrect_attempts" between 0 and 3),
	CONSTRAINT "practice_attempts_time_check" CHECK("__new_practice_attempts"."time_spent_seconds" between 0 and 86400),
	CONSTRAINT "practice_attempts_error_type_check" CHECK("__new_practice_attempts"."error_type" in ('concept', 'formula', 'algebra', 'units', 'sign', 'interpretation', 'syntax', 'logic', 'careless', 'unknown'))
);
--> statement-breakpoint
INSERT INTO `__new_practice_attempts`("id", "user_id", "practice_question_id", "topic_id", "practice_session_id", "study_task_id", "answer", "is_correct", "score", "confidence_before", "confidence_after", "hints_used", "incorrect_attempts", "time_spent_seconds", "error_type", "attempted_at") SELECT "id", "user_id", "practice_question_id", "topic_id", "practice_session_id", "study_task_id", "answer", "is_correct", "score", "confidence_before", "confidence_after", "hints_used", 0, "time_spent_seconds", "error_type", "attempted_at" FROM `practice_attempts`;--> statement-breakpoint
DROP TABLE `practice_attempts`;--> statement-breakpoint
ALTER TABLE `__new_practice_attempts` RENAME TO `practice_attempts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `practice_attempts_session_unique` ON `practice_attempts` (`practice_session_id`);--> statement-breakpoint
CREATE INDEX `practice_attempts_user_topic_idx` ON `practice_attempts` (`user_id`,`topic_id`,`attempted_at`);--> statement-breakpoint
CREATE INDEX `practice_attempts_question_idx` ON `practice_attempts` (`practice_question_id`);
