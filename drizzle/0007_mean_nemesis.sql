ALTER TABLE `assessments` ADD `source_uid` text;--> statement-breakpoint
ALTER TABLE `assessments` ADD `source_resource_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_import_uid_unique` ON `assessments` (`user_id`,`course_id`,`source_uid`) WHERE "assessments"."source_uid" is not null;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `source_uid` text;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `source_resource_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `class_sessions_import_uid_unique` ON `class_sessions` (`user_id`,`course_id`,`source_uid`) WHERE "class_sessions"."source_uid" is not null;