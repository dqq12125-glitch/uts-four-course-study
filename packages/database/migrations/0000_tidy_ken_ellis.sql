CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'active', 'expired', 'revoked', 'error');--> statement-breakpoint
CREATE TYPE "public"."learning_mode" AS ENUM('memory_retrieval', 'concept_understanding', 'quantitative_problem_solving', 'procedural_practice', 'programming_computation', 'reading_argumentation', 'language_communication', 'design_project', 'case_reasoning', 'simulation_experiment');--> statement-breakpoint
CREATE TYPE "public"."learning_session_status" AS ENUM('created', 'diagnostic', 'instruction', 'guided_practice', 'independent_practice', 'assessment', 'reflection', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."mastery_status" AS ENUM('not_started', 'introduced', 'needs_guidance', 'independent', 'transfer_ready');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'tombstoned');--> statement-breakpoint
CREATE TYPE "public"."tool_run_status" AS ENUM('observed', 'proposed', 'awaiting_approval', 'approved', 'executing', 'verified', 'failed', 'rolled_back');--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"learning_session_id" text,
	"role" text NOT NULL,
	"task_type" text NOT NULL,
	"provider_key" text NOT NULL,
	"model_key" text NOT NULL,
	"schema_name" text,
	"prompt_id" text,
	"prompt_version" integer,
	"cache_key_hash" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"estimated_cost_minor_usd" integer DEFAULT 0 NOT NULL,
	"confidence" double precision,
	"source_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"limitations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assessment_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"relationship_type" text DEFAULT 'assesses' NOT NULL,
	"weight" double precision,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"evidence_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"assignment_id" text,
	"title" text NOT NULL,
	"assessment_type" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"exam_at" timestamp with time zone,
	"weight_percent" double precision,
	"estimated_minutes" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"request_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"location" text,
	"event_type" text DEFAULT 'course' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "concept_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"from_concept_id" text NOT NULL,
	"to_concept_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"evidence_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "concept_mastery" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"status" "mastery_status" DEFAULT 'not_started' NOT NULL,
	"mastery_score" double precision DEFAULT 0 NOT NULL,
	"independent_accuracy" double precision DEFAULT 0 NOT NULL,
	"hint_dependency" double precision DEFAULT 0 NOT NULL,
	"explanation_quality" double precision DEFAULT 0 NOT NULL,
	"transfer_accuracy" double precision DEFAULT 0 NOT NULL,
	"delayed_recall" double precision DEFAULT 0 NOT NULL,
	"confidence" double precision DEFAULT 0 NOT NULL,
	"rule_version" integer NOT NULL,
	"evidence_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_practised_at" timestamp with time zone,
	"next_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"learning_objective_id" text,
	"name" text NOT NULL,
	"description" text,
	"concept_type" text DEFAULT 'concept' NOT NULL,
	"legacy_topic_id" text,
	"confidence" double precision,
	"review_status" text DEFAULT 'provisional' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "course_enrolments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "course_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"teaching_week_id" text,
	"title" text NOT NULL,
	"description" text,
	"sequence_number" integer DEFAULT 0 NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"institution_id" text,
	"lms_connection_id" text,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"colour_key" text DEFAULT 'slate' NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'active' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_plan_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"daily_plan_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text,
	"assessment_id" text,
	"learning_session_id" text,
	"title" text NOT NULL,
	"mode" "learning_mode" NOT NULL,
	"scheduled_start_at" timestamp with time zone,
	"estimated_minutes" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"priority_score" double precision NOT NULL,
	"priority_signals" jsonb NOT NULL,
	"reason" text NOT NULL,
	"required_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"plan_date" date NOT NULL,
	"timezone" text NOT NULL,
	"planner_version" integer NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "data_migration_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_system" text NOT NULL,
	"source_snapshot_id" text NOT NULL,
	"source_checksum" text NOT NULL,
	"row_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id_mapping_checksum" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "error_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"error_type" text NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"evidence_attempt_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"country" text,
	"timezone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learning_objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"statement" text NOT NULL,
	"bloom_verb" text,
	"confidence" double precision,
	"review_status" text DEFAULT 'provisional' NOT NULL,
	"evidence_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learning_session_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"learning_session_id" text NOT NULL,
	"definition_id" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"step_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text,
	"assessment_id" text,
	"mode" "learning_mode" NOT NULL,
	"pack_version" integer NOT NULL,
	"router_version" integer NOT NULL,
	"router_decision" jsonb NOT NULL,
	"status" "learning_session_status" DEFAULT 'created' NOT NULL,
	"current_step_id" text,
	"available_minutes" integer NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lms_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text,
	"connector_id" text NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"encrypted_credentials" jsonb,
	"credential_key_id" text,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	"requested_ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"notification_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resource_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"resource_version_id" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"page" integer,
	"slide" integer,
	"section" text,
	"timestamp_start" double precision,
	"timestamp_end" double precision,
	"source_url" text,
	"embedding" vector(1536),
	"embedding_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resource_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"relationship_type" text DEFAULT 'explains' NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"evidence_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resource_processing_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"resource_version_id" text NOT NULL,
	"job_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "processing_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_summary" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resource_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"file_hash" text NOT NULL,
	"content_hash" text,
	"size_bytes" integer,
	"source_updated_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"parser_version" text,
	"embedding_version" text,
	"processing_status" "processing_status" DEFAULT 'pending' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"title" text NOT NULL,
	"resource_type" text NOT NULL,
	"mime_type" text,
	"storage_key" text,
	"status" "processing_status" DEFAULT 'pending' NOT NULL,
	"current_version_id" text,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"forgetting_risk" double precision DEFAULT 0 NOT NULL,
	"interval_hours" integer NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"title" text NOT NULL,
	"criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text,
	"learning_session_id" text NOT NULL,
	"step_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"response" jsonb NOT NULL,
	"correct" boolean,
	"score" double precision,
	"hint_level" integer DEFAULT 0 NOT NULL,
	"response_time_ms" integer,
	"error_type" text,
	"explanation_quality" double precision,
	"is_independent" boolean DEFAULT false NOT NULL,
	"is_transfer" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teaching_weeks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"week_number" integer NOT NULL,
	"title" text NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"tool_id" text NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"encrypted_credentials" jsonb,
	"credential_key_id" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"device_id" text,
	"last_observed_at" timestamp with time zone,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_id" text,
	"assessment_id" text,
	"tool_id" text NOT NULL,
	"capability" text,
	"required" boolean DEFAULT true NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"source_url" text,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"learning_session_id" text,
	"tool_connection_id" text NOT NULL,
	"project_id" text,
	"status" "tool_run_status" DEFAULT 'observed' NOT NULL,
	"before_snapshot" jsonb,
	"proposed_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval" jsonb,
	"action_hash" text,
	"executed_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"after_snapshot" jsonb,
	"verification" jsonb,
	"rollback_data" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"daily_study_minutes" integer DEFAULT 60 NOT NULL,
	"preferred_study_start_time" time,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"academic_integrity_mode" boolean DEFAULT true NOT NULL,
	"ai_explanation_language" text DEFAULT 'zh-CN' NOT NULL,
	"learning_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"display_name" text,
	"preferred_language" text DEFAULT 'zh-CN' NOT NULL,
	"timezone" text DEFAULT 'Australia/Sydney' NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_learning_session_id_learning_sessions_id_fk" FOREIGN KEY ("learning_session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_concepts" ADD CONSTRAINT "assessment_concepts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_concepts" ADD CONSTRAINT "assessment_concepts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_concepts" ADD CONSTRAINT "assessment_concepts_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_concepts" ADD CONSTRAINT "assessment_concepts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_from_concept_id_concepts_id_fk" FOREIGN KEY ("from_concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_to_concept_id_concepts_id_fk" FOREIGN KEY ("to_concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_learning_objective_id_learning_objectives_id_fk" FOREIGN KEY ("learning_objective_id") REFERENCES "public"."learning_objectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrolments" ADD CONSTRAINT "course_enrolments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrolments" ADD CONSTRAINT "course_enrolments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrolments" ADD CONSTRAINT "course_enrolments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_teaching_week_id_teaching_weeks_id_fk" FOREIGN KEY ("teaching_week_id") REFERENCES "public"."teaching_weeks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_lms_connection_id_lms_connections_id_fk" FOREIGN KEY ("lms_connection_id") REFERENCES "public"."lms_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_daily_plan_id_daily_plans_id_fk" FOREIGN KEY ("daily_plan_id") REFERENCES "public"."daily_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_learning_session_id_learning_sessions_id_fk" FOREIGN KEY ("learning_session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_session_steps" ADD CONSTRAINT "learning_session_steps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_session_steps" ADD CONSTRAINT "learning_session_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_session_steps" ADD CONSTRAINT "learning_session_steps_learning_session_id_learning_sessions_id_fk" FOREIGN KEY ("learning_session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lms_connections" ADD CONSTRAINT "lms_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lms_connections" ADD CONSTRAINT "lms_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lms_connections" ADD CONSTRAINT "lms_connections_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_chunks" ADD CONSTRAINT "resource_chunks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_chunks" ADD CONSTRAINT "resource_chunks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_chunks" ADD CONSTRAINT "resource_chunks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_chunks" ADD CONSTRAINT "resource_chunks_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_chunks" ADD CONSTRAINT "resource_chunks_resource_version_id_resource_versions_id_fk" FOREIGN KEY ("resource_version_id") REFERENCES "public"."resource_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_concepts" ADD CONSTRAINT "resource_concepts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_concepts" ADD CONSTRAINT "resource_concepts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_concepts" ADD CONSTRAINT "resource_concepts_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_concepts" ADD CONSTRAINT "resource_concepts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_processing_jobs" ADD CONSTRAINT "resource_processing_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_processing_jobs" ADD CONSTRAINT "resource_processing_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_processing_jobs" ADD CONSTRAINT "resource_processing_jobs_resource_version_id_resource_versions_id_fk" FOREIGN KEY ("resource_version_id") REFERENCES "public"."resource_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD CONSTRAINT "resource_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD CONSTRAINT "resource_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD CONSTRAINT "resource_versions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_learning_session_id_learning_sessions_id_fk" FOREIGN KEY ("learning_session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD CONSTRAINT "student_attempts_step_id_learning_session_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."learning_session_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_weeks" ADD CONSTRAINT "teaching_weeks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_weeks" ADD CONSTRAINT "teaching_weeks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_connections" ADD CONSTRAINT "tool_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_connections" ADD CONSTRAINT "tool_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_requirements" ADD CONSTRAINT "tool_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_requirements" ADD CONSTRAINT "tool_requirements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_requirements" ADD CONSTRAINT "tool_requirements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_requirements" ADD CONSTRAINT "tool_requirements_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_requirements" ADD CONSTRAINT "tool_requirements_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_learning_session_id_learning_sessions_id_fk" FOREIGN KEY ("learning_session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tool_connection_id_tool_connections_id_fk" FOREIGN KEY ("tool_connection_id") REFERENCES "public"."tool_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_interactions_owner_created_idx" ON "ai_interactions" USING btree ("tenant_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_interactions_course_idx" ON "ai_interactions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "announcements_course_published_idx" ON "announcements" USING btree ("course_id","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_concepts_relation_unique" ON "assessment_concepts" USING btree ("assessment_id","concept_id");--> statement-breakpoint
CREATE INDEX "assessments_owner_course_due_idx" ON "assessments" USING btree ("tenant_id","user_id","course_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_course_source_unique" ON "assessments" USING btree ("course_id","source_type","source_id") WHERE "assessments"."source_id" is not null and "assessments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "assignments_owner_course_due_idx" ON "assignments" USING btree ("tenant_id","user_id","course_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_course_source_unique" ON "assignments" USING btree ("course_id","source_type","source_id") WHERE "assignments"."source_id" is not null and "assignments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_created_idx" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "calendar_events_owner_start_idx" ON "calendar_events" USING btree ("tenant_id","user_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "concept_edges_relation_unique" ON "concept_edges" USING btree ("from_concept_id","to_concept_id","relationship_type");--> statement-breakpoint
CREATE INDEX "concept_edges_course_idx" ON "concept_edges" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "concept_mastery_user_concept_unique" ON "concept_mastery" USING btree ("user_id","concept_id");--> statement-breakpoint
CREATE INDEX "concept_mastery_owner_review_idx" ON "concept_mastery" USING btree ("tenant_id","user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "concepts_owner_course_idx" ON "concepts" USING btree ("tenant_id","user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "concepts_course_legacy_topic_unique" ON "concepts" USING btree ("course_id","legacy_topic_id") WHERE "concepts"."legacy_topic_id" is not null and "concepts"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "course_enrolments_course_user_unique" ON "course_enrolments" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "course_enrolments_owner_idx" ON "course_enrolments" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "course_modules_course_sequence_idx" ON "course_modules" USING btree ("course_id","sequence_number");--> statement-breakpoint
CREATE INDEX "courses_owner_idx" ON "courses" USING btree ("tenant_id","owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_owner_source_unique" ON "courses" USING btree ("owner_user_id","source_type","source_id") WHERE "courses"."source_id" is not null and "courses"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_plan_items_sequence_unique" ON "daily_plan_items" USING btree ("daily_plan_id","sequence_number");--> statement-breakpoint
CREATE INDEX "daily_plan_items_owner_idx" ON "daily_plan_items" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_plans_user_date_version_unique" ON "daily_plans" USING btree ("user_id","plan_date","planner_version");--> statement-breakpoint
CREATE INDEX "daily_plans_owner_date_idx" ON "daily_plans" USING btree ("tenant_id","user_id","plan_date");--> statement-breakpoint
CREATE UNIQUE INDEX "data_migration_runs_snapshot_unique" ON "data_migration_runs" USING btree ("source_system","source_snapshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "error_patterns_user_concept_type_unique" ON "error_patterns" USING btree ("user_id","concept_id","error_type");--> statement-breakpoint
CREATE UNIQUE INDEX "institutions_name_unique" ON "institutions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "learning_objectives_course_idx" ON "learning_objectives" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_session_steps_sequence_unique" ON "learning_session_steps" USING btree ("learning_session_id","sequence_number");--> statement-breakpoint
CREATE INDEX "learning_sessions_owner_status_idx" ON "learning_sessions" USING btree ("tenant_id","user_id","status");--> statement-breakpoint
CREATE INDEX "learning_sessions_course_idx" ON "learning_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "lms_connections_owner_idx" ON "lms_connections" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lms_connections_source_unique" ON "lms_connections" USING btree ("user_id","connector_id","source_id") WHERE "lms_connections"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "magic_link_tokens_hash_unique" ON "magic_link_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "magic_link_tokens_email_idx" ON "magic_link_tokens" USING btree ("email","expires_at");--> statement-breakpoint
CREATE INDEX "notifications_owner_status_idx" ON "notifications" USING btree ("tenant_id","user_id","status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_chunks_version_sequence_unique" ON "resource_chunks" USING btree ("resource_version_id","sequence_number");--> statement-breakpoint
CREATE INDEX "resource_chunks_owner_course_idx" ON "resource_chunks" USING btree ("tenant_id","user_id","course_id");--> statement-breakpoint
CREATE INDEX "resource_chunks_embedding_hnsw_idx" ON "resource_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64) WHERE "resource_chunks"."embedding" is not null and "resource_chunks"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "resource_concepts_relation_unique" ON "resource_concepts" USING btree ("resource_id","concept_id","relationship_type");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_processing_jobs_idempotency_unique" ON "resource_processing_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "resource_processing_jobs_status_idx" ON "resource_processing_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_versions_resource_number_unique" ON "resource_versions" USING btree ("resource_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_versions_resource_hash_unique" ON "resource_versions" USING btree ("resource_id","file_hash");--> statement-breakpoint
CREATE INDEX "resource_versions_owner_idx" ON "resource_versions" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "resources_owner_course_idx" ON "resources" USING btree ("tenant_id","user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resources_course_source_unique" ON "resources" USING btree ("course_id","source_type","source_id") WHERE "resources"."source_id" is not null and "resources"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "review_schedule_owner_due_idx" ON "review_schedule" USING btree ("tenant_id","user_id","status","due_at");--> statement-breakpoint
CREATE INDEX "rubrics_assessment_idx" ON "rubrics" USING btree ("assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_attempts_step_number_unique" ON "student_attempts" USING btree ("step_id","attempt_number");--> statement-breakpoint
CREATE INDEX "student_attempts_owner_concept_idx" ON "student_attempts" USING btree ("tenant_id","user_id","concept_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teaching_weeks_course_number_unique" ON "teaching_weeks" USING btree ("course_id","week_number");--> statement-breakpoint
CREATE INDEX "tool_connections_owner_idx" ON "tool_connections" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_connections_user_tool_device_unique" ON "tool_connections" USING btree ("user_id","tool_id","device_id");--> statement-breakpoint
CREATE INDEX "tool_requirements_course_idx" ON "tool_requirements" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "tool_runs_owner_created_idx" ON "tool_runs" USING btree ("tenant_id","user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_unique" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_preferences_tenant_idx" ON "user_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_unique" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");
