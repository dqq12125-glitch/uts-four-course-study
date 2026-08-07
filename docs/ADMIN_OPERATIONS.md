# Admin Operations

The first-phase admin role is intentionally narrow. Every `/admin` page and
admin API performs server-side role validation; hiding a button is never the
authorization boundary.

## Creating an administrator

There is no public role-escalation endpoint. Register and verify an ordinary
account, then execute the following against the intended D1 environment:

```sql
UPDATE users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = lower('owner@example.com')
  AND status = 'active'
  AND deleted_at IS NULL;
```

Required operator checks:

1. back up/bookmark D1;
2. use an authenticated Cloudflare account;
3. verify exactly one row changed;
4. record the operator and reason outside the application;
5. have the user sign out and sign in again;
6. confirm `/admin` works and an ordinary student still receives `404`.

Do not expose this operation as a self-service route.

## Available controls

- user, onboarding, active, and paid counts;
- revenue/refund and AI usage summaries;
- recent users and account suspension/reactivation;
- course-template creation/editing/activation;
- original public-question review/rejection;
- environment-scoped feature flags;
- payment status summaries;
- structured error and scheduled-job summaries;
- an authenticated manual run of the scheduled job.

## Private-data boundary

Admins do not receive a default UI for full private uploads or AI transcripts.
`support_access_grants` models explicit, time-limited, auditable support scopes,
but the current admin dashboard does not silently use it to reveal content.

Any future support-access workflow must require:

- a documented support/security reason;
- the minimum scope;
- an expiry;
- an audit entry;
- a visible revocation path;
- a policy for notifying the user where appropriate.

## Feature flags

Flags are stored per `development`, `test`, `preview`, or `production`:

- `payments_enabled`
- `file_upload_enabled`
- `ai_tutor_enabled`
- `practice_generation_enabled`
- `weekly_report_enabled`
- `exam_sprint_enabled`
- `semester_pass_enabled`
- `admin_dashboard_enabled`

Development/test defaults enable implemented integrations with their explicit
mocks/adapters. Preview/production defaults are fail-closed for payments,
uploads, AI tutor, reports, hidden products, and admin dashboard until an admin
creates an override.

## Account suspension

Suspension blocks the account but does not delete data. Admins cannot suspend
themselves from the dashboard. Account deletion remains a user-owned privacy
operation; operational deletion requests should follow the same audited
process rather than direct table deletion.

## Incident checks

For an incident:

1. preserve request IDs and safe structured error codes;
2. do not copy private files/transcripts into tickets;
3. disable the narrow feature flag when possible;
4. inspect failed webhook/job summaries;
5. rotate exposed provider secrets;
6. use a forward database repair, not destructive rollback;
7. document affected users, window, action, and recovery.

## Scheduled jobs

The hourly job is deduplicated by job name/scheduled hour. It:

- generates reminders in each user's time zone;
- creates delivery rows with retry state;
- sends eligible emails;
- cleans deleted/expired resources;
- records processed and failed counts.

Manual admin execution invokes the same service and therefore the same
deduplication and audit boundaries.

