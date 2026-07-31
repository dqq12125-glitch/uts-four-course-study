# Database

DeepStudy uses Cloudflare D1 (SQLite) through explicit repositories. All
timestamp instants are UTC ISO-8601 text. Semester/task calendar dates use
`YYYY-MM-DD` and are interpreted with the user's IANA time zone.

## Migrations

| Migration | Purpose |
| --- | --- |
| `0000_uneven_satana.sql` | SaaS/auth/semester/course/task base; seeds UTS and four optional templates |
| `0001_legal_klaw.sql` | One active semester per user |
| `0002_curly_starhawk.sql` | Focus, private practice, attempts, mastery, and retests |
| `0003_crazy_jack_murdock.sql` | Server-owned failed-check state and active-session indexes |
| `0004_goofy_kid_colt.sql` | Persists failed checks on completed attempts |
| `0005_nebulous_lady_bullseye.sql` | Payments, flags, AI, private resources, notifications, jobs, and support grants |
| `0006_last_butterfly.sql` | Stable user-owned task ordering |
| `0007_mean_nemesis.sql` | Stable source IDs for idempotent timetable and deadline re-imports |

Seeds use deterministic IDs and `INSERT OR IGNORE`. They never seed personal
rooms, timetables, assessments, progress, language settings, uploads, or AI
content.

Apply locally:

```powershell
npm run db:migrate:local
```

Generate after schema changes:

```powershell
npm run db:generate
```

## Tables

### Identity and account

- `users`
- `user_settings`
- `auth_sessions`
- `magic_link_tokens`
- `auth_rate_limits`
- `notification_preferences`

### Academic planning

- `institutions`
- `semesters`
- `user_semesters`
- `course_templates`
- `courses`
- `class_sessions`
- `assessments`
- `topics`
- `study_tasks`
- `focus_sessions`

### Practice and mastery

- `practice_questions`
- `practice_sessions`
- `practice_attempts`
- `mastery_records`

### AI and private resources

- `ai_conversations`
- `ai_messages`
- `ai_usage_logs`
- `learning_resources`
- `resource_extractions`

### Commerce

- `subscriptions`
- `purchases`
- `payment_webhook_events`

### Operations

- `usage_events`
- `audit_logs`
- `feature_flags`
- `notifications`
- `notification_deliveries`
- `scheduled_job_runs`
- `support_access_grants`

## Ownership model

Every student entity query is scoped by the authenticated `user_id`.
References supplied by clients are checked through owned joins or
`INSERT ... SELECT` from an already owned parent. Examples:

- course: `id = ? AND user_id = ?`;
- assessment/class/topic: both row owner and course owner match;
- task/focus/practice/mastery: direct owner plus owned parent joins;
- AI conversation/resource IDs: account, course, topic, and current task are
  revalidated;
- purchase/notification/export: current user only.

Admin routes separately require `role = 'admin'`. Admin role does not remove
student ownership predicates from ordinary product services.

## Open courses

`course_templates` is an optional public catalogue. `courses` is the private
user snapshot:

- only `course_name`, `user_id`, and `user_semester_id` are required;
- institution, template, code, and instructor are optional;
- a template edit/deactivation cannot rewrite a user's course;
- private practice and mastery use the user's `course_id`, not a hard-coded
  UTS subject key.

Public-bank questions must be ownerless, reviewed, original, and optionally
template-linked. User-generated/resource-derived questions keep
`owner_user_id`.

## Important invariants

- one active semester per user;
- one active focus session per user;
- one active practice session per user;
- one open retest task per user/topic;
- one mastery record per user/topic;
- one completed attempt per practice session;
- one webhook row per provider event ID;
- one feature-flag override per environment/key;
- one notification per user/deduplication key;
- one delivery per notification/channel;
- one scheduled run per job/hour;
- one imported source UID per user/course for class sessions and assessments;
- file sizes, statuses, mastery scores, hint counts, times, and commerce
  amounts have database checks.

Practice completion, mastery update, retest scheduling, and learning events use
a D1 batch. Webhook amount/currency are checked against the server catalogue
before purchase activation.

## Resource privacy

`learning_resources.storage_key` is never returned by normal export/list DTOs.
It has a unique unpredictable user/resource path. Extraction rows carry the
same user ID and are deleted with the resource/account. R2 remains the source
of file bytes; D1 stores metadata and proposals.

## Backup and rollback

Before remote migration:

1. create a D1 backup/bookmark;
2. record table row counts;
3. apply migrations in order;
4. verify migration history, constraints, and seed counts;
5. run two-user isolation and payment replay smoke tests.

Rollback is forward-only:

- deploy a previous compatible application build;
- use a compensating migration for schema/data repair;
- deactivate templates/flags instead of deleting referenced rows.

Do not destructively reverse D1 schema changes in production.
