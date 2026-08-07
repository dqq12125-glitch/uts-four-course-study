CREATE TABLE "resource_sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"source_course_id" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"discovered_count" integer DEFAULT 0 NOT NULL,
	"created_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"tombstoned_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "resource_processing_jobs" ADD COLUMN "max_attempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD COLUMN "mime_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD COLUMN "storage_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD COLUMN "quality_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD COLUMN "quality_report" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "legacy_resource_id" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "resource_sync_runs" ADD CONSTRAINT "resource_sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_sync_runs" ADD CONSTRAINT "resource_sync_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_sync_runs" ADD CONSTRAINT "resource_sync_runs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_sync_runs" ADD CONSTRAINT "resource_sync_runs_connection_id_lms_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."lms_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resource_sync_runs_course_idx" ON "resource_sync_runs" USING btree ("tenant_id","user_id","course_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_versions_storage_key_unique" ON "resource_versions" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "resources_legacy_unique" ON "resources" USING btree ("legacy_resource_id") WHERE "resources"."legacy_resource_id" is not null;