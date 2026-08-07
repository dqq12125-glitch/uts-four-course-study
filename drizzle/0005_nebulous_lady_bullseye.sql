CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`topic_id` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ai_conversations_status_check" CHECK("ai_conversations"."status" in ('active', 'archived', 'deleted'))
);
--> statement-breakpoint
CREATE INDEX `ai_conversations_user_updated_idx` ON `ai_conversations` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`token_input` integer DEFAULT 0 NOT NULL,
	`token_output` integer DEFAULT 0 NOT NULL,
	`model_key` text NOT NULL,
	`safety_mode` text DEFAULT 'hint_first' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ai_messages_role_check" CHECK("ai_messages"."role" in ('user', 'assistant', 'system'))
);
--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_created_idx` ON `ai_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_messages_user_created_idx` ON `ai_messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ai_usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`feature` text NOT NULL,
	`model_key` text NOT NULL,
	`token_input` integer DEFAULT 0 NOT NULL,
	`token_output` integer DEFAULT 0 NOT NULL,
	`latency_ms` integer NOT NULL,
	`success` integer NOT NULL,
	`error_code` text,
	`estimated_cost_minor_usd` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ai_usage_logs_token_check" CHECK("ai_usage_logs"."token_input" >= 0 and "ai_usage_logs"."token_output" >= 0)
);
--> statement-breakpoint
CREATE INDEX `ai_usage_logs_user_created_idx` ON `ai_usage_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_usage_logs_feature_created_idx` ON `ai_usage_logs` (`feature`,`created_at`);--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`environment` text NOT NULL,
	`flag_key` text NOT NULL,
	`enabled` integer NOT NULL,
	`updated_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "feature_flags_environment_check" CHECK("feature_flags"."environment" in ('development', 'preview', 'production', 'test'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feature_flags_environment_key_unique` ON `feature_flags` (`environment`,`flag_key`);--> statement-breakpoint
CREATE TABLE `learning_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`file_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`resource_type` text NOT NULL,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`retention_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_resources_size_check" CHECK("learning_resources"."file_size" between 1 and 10485760),
	CONSTRAINT "learning_resources_type_check" CHECK("learning_resources"."resource_type" in ('lecture_notes', 'subject_information', 'assessment_information', 'personal_notes', 'timetable', 'other')),
	CONSTRAINT "learning_resources_processing_check" CHECK("learning_resources"."processing_status" in ('pending', 'processing', 'awaiting_confirmation', 'ready', 'failed', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_resources_storage_key_unique` ON `learning_resources` (`storage_key`);--> statement-breakpoint
CREATE INDEX `learning_resources_user_course_idx` ON `learning_resources` (`user_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `learning_resources_retention_idx` ON `learning_resources` (`retention_until`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`provider_message_id` text,
	`last_error` text,
	`next_attempt_at` text,
	`sent_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notification_deliveries_channel_check" CHECK("notification_deliveries"."channel" in ('in_app', 'email')),
	CONSTRAINT "notification_deliveries_status_check" CHECK("notification_deliveries"."status" in ('pending', 'sending', 'sent', 'failed', 'skipped'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_deliveries_notification_channel_unique` ON `notification_deliveries` (`notification_id`,`channel`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_retry_idx` ON `notification_deliveries` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tomorrow_classes` integer DEFAULT true NOT NULL,
	`deadline_approaching` integer DEFAULT true NOT NULL,
	`daily_plan` integer DEFAULT true NOT NULL,
	`review_due` integer DEFAULT true NOT NULL,
	`weekly_report` integer DEFAULT true NOT NULL,
	`marketing` integer DEFAULT false NOT NULL,
	`unsubscribed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`action_url` text,
	`dedupe_key` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notifications_type_check" CHECK("notifications"."notification_type" in ('tomorrow_classes', 'deadline_approaching', 'daily_plan', 'review_due', 'weekly_report', 'system'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_user_dedupe_unique` ON `notifications` (`user_id`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`payload_hash` text NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`last_error` text,
	`received_at` text NOT NULL,
	`processed_at` text,
	CONSTRAINT "payment_webhook_events_status_check" CHECK("payment_webhook_events"."status" in ('processing', 'processed', 'failed', 'ignored'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_webhook_events_provider_unique` ON `payment_webhook_events` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_webhook_events_status_idx` ON `payment_webhook_events` (`status`,`received_at`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`provider_payment_id` text,
	`provider_checkout_session_id` text,
	`product_key` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`access_start_at` text,
	`access_end_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "purchases_amount_check" CHECK("purchases"."amount_minor" >= 0),
	CONSTRAINT "purchases_status_check" CHECK("purchases"."status" in ('pending', 'active', 'failed', 'refunded', 'expired'))
);
--> statement-breakpoint
CREATE INDEX `purchases_user_status_idx` ON `purchases` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_provider_payment_unique` ON `purchases` (`provider`,`provider_payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_checkout_session_unique` ON `purchases` (`provider`,`provider_checkout_session_id`);--> statement-breakpoint
CREATE TABLE `resource_extractions` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`user_id` text NOT NULL,
	`extracted_text` text,
	`proposed_data_json` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`failure_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`confirmed_at` text,
	FOREIGN KEY (`resource_id`) REFERENCES `learning_resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_extractions_status_check" CHECK("resource_extractions"."status" in ('pending', 'processing', 'awaiting_confirmation', 'confirmed', 'failed', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_extractions_resource_unique` ON `resource_extractions` (`resource_id`);--> statement-breakpoint
CREATE INDEX `resource_extractions_user_status_idx` ON `resource_extractions` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `scheduled_job_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_name` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text DEFAULT 'running' NOT NULL,
	`processed_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`error_summary` text,
	CONSTRAINT "scheduled_job_runs_status_check" CHECK("scheduled_job_runs"."status" in ('running', 'completed', 'failed', 'skipped'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scheduled_job_runs_job_schedule_unique` ON `scheduled_job_runs` (`job_name`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`provider_customer_id` text,
	`provider_subscription_id` text,
	`product_key` text NOT NULL,
	`status` text DEFAULT 'free' NOT NULL,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "subscriptions_status_check" CHECK("subscriptions"."status" in ('free', 'active', 'past_due', 'cancelled', 'expired', 'refunded'))
);
--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_idx` ON `subscriptions` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_provider_id_unique` ON `subscriptions` (`provider`,`provider_subscription_id`);--> statement-breakpoint
CREATE TABLE `support_access_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text NOT NULL,
	`target_user_id` text NOT NULL,
	`reason` text NOT NULL,
	`scope` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "support_access_grants_scope_check" CHECK("support_access_grants"."scope" in ('account_metadata', 'billing', 'private_content'))
);
--> statement-breakpoint
CREATE INDEX `support_access_grants_target_idx` ON `support_access_grants` (`target_user_id`,`expires_at`);