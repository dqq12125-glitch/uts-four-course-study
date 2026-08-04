CREATE TABLE `lms_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`connector_id` text NOT NULL,
	`display_name` text NOT NULL,
	`base_url` text,
	`encrypted_credentials_json` text,
	`credential_key_id` text,
	`scopes_json` text DEFAULT '[]' NOT NULL,
	`source_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lms_connections_connector_check" CHECK("lms_connections"."connector_id" in ('mock', 'manual-upload', 'canvas')),
	CONSTRAINT "lms_connections_status_check" CHECK("lms_connections"."status" in ('pending', 'active', 'expired', 'revoked', 'error'))
);
--> statement-breakpoint
CREATE INDEX `lms_connections_user_idx` ON `lms_connections` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `lms_connections_user_source_unique` ON `lms_connections` (`user_id`,`connector_id`,`source_id`) WHERE "lms_connections"."source_id" is not null and "lms_connections"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `lms_course_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`source_course_id` text NOT NULL,
	`source_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `lms_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lms_course_links_course_unique` ON `lms_course_links` (`user_id`,`course_id`) WHERE "lms_course_links"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `lms_course_links_source_unique` ON `lms_course_links` (`connection_id`,`source_course_id`) WHERE "lms_course_links"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `resource_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`resource_version_id` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`content` text NOT NULL,
	`content_hash` text NOT NULL,
	`page` integer,
	`slide` integer,
	`section` text,
	`timestamp_start` integer,
	`timestamp_end` integer,
	`source_url` text,
	`embedding_json` text,
	`embedding_version` text,
	`reused_from_chunk_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_chunks_locator_check" CHECK(("resource_chunks"."page" is not null) + ("resource_chunks"."slide" is not null) + ("resource_chunks"."section" is not null) = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_chunks_version_sequence_unique` ON `resource_chunks` (`resource_version_id`,`sequence_number`);--> statement-breakpoint
CREATE INDEX `resource_chunks_user_course_idx` ON `resource_chunks` (`user_id`,`course_id`,`resource_id`);--> statement-breakpoint
CREATE INDEX `resource_chunks_content_hash_idx` ON `resource_chunks` (`resource_id`,`content_hash`);--> statement-breakpoint
CREATE TABLE `resource_processing_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_version_id` text NOT NULL,
	`job_type` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`error_code` text,
	`error_summary` text,
	`started_at` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_processing_jobs_status_check" CHECK("resource_processing_jobs"."status" in ('pending', 'processing', 'completed', 'failed', 'tombstoned')),
	CONSTRAINT "resource_processing_jobs_attempt_check" CHECK("resource_processing_jobs"."attempt_count" >= 0 and "resource_processing_jobs"."max_attempts" between 1 and 10)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_processing_jobs_idempotency_unique` ON `resource_processing_jobs` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `resource_processing_jobs_status_idx` ON `resource_processing_jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `resource_sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`connector_id` text NOT NULL,
	`source_course_id` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`discovered_count` integer DEFAULT 0 NOT NULL,
	`created_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`tombstoned_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`details_json` text DEFAULT '{}' NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `lms_connections`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_sync_runs_status_check" CHECK("resource_sync_runs"."status" in ('processing', 'completed', 'partial', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `resource_sync_runs_course_idx` ON `resource_sync_runs` (`user_id`,`course_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `resource_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`storage_key` text NOT NULL,
	`file_hash` text NOT NULL,
	`content_hash` text,
	`size_bytes` integer NOT NULL,
	`source_updated_at` text,
	`last_synced_at` text,
	`parser_version` text,
	`embedding_version` text,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`quality_status` text DEFAULT 'pending' NOT NULL,
	`quality_report_json` text,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_versions_status_check" CHECK("resource_versions"."processing_status" in ('pending', 'processing', 'completed', 'failed', 'tombstoned')),
	CONSTRAINT "resource_versions_quality_check" CHECK("resource_versions"."quality_status" in ('pending', 'passed', 'warning', 'failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_versions_resource_number_unique` ON `resource_versions` (`resource_id`,`version_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `resource_versions_resource_hash_unique` ON `resource_versions` (`resource_id`,`file_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `resource_versions_storage_key_unique` ON `resource_versions` (`storage_key`);--> statement-breakpoint
CREATE INDEX `resource_versions_user_idx` ON `resource_versions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`legacy_resource_id` text,
	`connection_id` text,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`source_url` text,
	`source_updated_at` text,
	`title` text NOT NULL,
	`resource_type` text NOT NULL,
	`mime_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`current_version_id` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `lms_connections`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "resources_status_check" CHECK("resources"."status" in ('pending', 'processing', 'completed', 'failed', 'tombstoned'))
);
--> statement-breakpoint
CREATE INDEX `resources_user_course_idx` ON `resources` (`user_id`,`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `resources_legacy_unique` ON `resources` (`legacy_resource_id`) WHERE "resources"."legacy_resource_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `resources_course_source_unique` ON `resources` (`course_id`,`source_type`,`source_id`) WHERE "resources"."deleted_at" is null;