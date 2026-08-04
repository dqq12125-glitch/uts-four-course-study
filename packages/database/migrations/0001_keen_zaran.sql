CREATE TABLE "legacy_import_rows" (
	"id" text PRIMARY KEY NOT NULL,
	"migration_run_id" text NOT NULL,
	"source_table" text NOT NULL,
	"source_row_id" text NOT NULL,
	"owner_user_id" text,
	"source_tenant_id" text,
	"row_checksum" text NOT NULL,
	"payload" jsonb NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legacy_import_rows" ADD CONSTRAINT "legacy_import_rows_migration_run_id_data_migration_runs_id_fk" FOREIGN KEY ("migration_run_id") REFERENCES "public"."data_migration_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_import_rows_run_source_unique" ON "legacy_import_rows" USING btree ("migration_run_id","source_table","source_row_id");--> statement-breakpoint
CREATE INDEX "legacy_import_rows_owner_idx" ON "legacy_import_rows" USING btree ("owner_user_id");