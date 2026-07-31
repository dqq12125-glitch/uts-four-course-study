# Milestone 1 Stage Report

Date: 2026-07-30

## 1. What changed

- Added a 16-table D1/Drizzle SaaS foundation with ordered migrations.
- Added optional UTS/Spring 2026 template seeds without personal timetable,
  room, Assessment, task, or progress data.
- Added passwordless Magic Link registration, sign-in, verification, sessions,
  sign-out, persistent rate limiting, and email provider abstraction.
- Added six-step mobile-first onboarding.
- Allowed any institution, semester, and course; course code and template are
  optional.
- Added ownership-checked user-semester list, create, update, and archive APIs.
- Added private timetable and Assessment capture during onboarding.
- Added an explainable deterministic daily-plan generator with capacity limits
  and completion criteria.
- Added dynamic `/app/today`, course list, course detail, course editing/archive,
  Assessment creation, and task status updates.
- Added unified API error responses with request IDs.
- Added ownership-aware D1 repositories and isolation tests.
- Preserved the original four-course implementation as an independent component
  behind owner-only `/personal`, while keeping `/` as a temporary compatibility
  alias.

## 2. Database tables created

`users`, `user_settings`, `auth_sessions`, `magic_link_tokens`,
`auth_rate_limits`, `institutions`, `semesters`, `user_semesters`,
`course_templates`, `courses`, `class_sessions`, `assessments`, `topics`,
`study_tasks`, `usage_events`, and `audit_logs`.

## 3. Available pages

- `/auth/sign-up`
- `/auth/sign-in`
- `/auth/verify`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/onboarding`
- `/personal` (configured owner only)
- `/app/today`
- `/app/courses`
- `/app/courses/:courseId`

The legacy `/` remains a temporary public compatibility alias. The public
marketing replacement is deferred to Milestone 5; replacing it will not remove
the independent `/personal` component.

## 4. Passing validation

- TypeScript strict typecheck
- ESLint
- Vinext production build
- eight new planning/validation/time-zone/Cookie/personal-access unit scenarios
- five new migration/auth/open-course/isolation integration scenarios
- two E2E scenarios: service boundary and built-Worker HTTP
- all pre-existing study-content and rendered-page tests
- Chrome responsive QA at 320, 375, 390, 430, 768, 1024, and 1440 px
- production dependency audit: 0 vulnerabilities (`npm audit --omit=dev`)

Final Milestone 1 full-suite result: **37 passed, 0 failed**.

## 5. Failed validation

No known test remains failing after fixes.

During HTTP QA, verification initially returned `500` because a Fetch
`Response.redirect()` has immutable headers and could not receive the session
cookie. The route now constructs a single mutable 303 response with `Location`
and `Set-Cookie`, and the HTTP E2E covers the corrected path.

`vinext start` outside the Worker runtime did not serve emitted browser assets;
this is documented as a release-gate limitation. Worker build and HTML render
tests pass.

## 6. Manual services still required

- Real preview/production Cloudflare D1 database bound as `DB`
- Remote migration application
- Verified email sender and `EMAIL_API_KEY`
- Random production `IP_HASH_SECRET`
- Server-only `PERSONAL_OWNER_EMAIL` for the private four-course workspace
- Canonical `APP_BASE_URL`
- Preview smoke test in two independent browser profiles

Stripe, R2, Queues, Cron, and production AI usage control are not configured.

## 7. Recommended next milestone

Proceed to Milestone 2: focus sessions, practice attempts, mastery records,
configurable 48-hour review scheduling, review tasks, and plan rebalancing.
Keep the same open-course contract: these entities attach to generic courses
and topics, never to hardcoded UTS subject IDs.

## 8. Security and architecture risks

- The legacy tutor endpoint is still anonymous and uses process-local rate
  limiting. It must not be treated as public-SaaS ready.
- `/` still renders the legacy personal content without owner authorization.
  This compatibility alias must be replaced by the marketing page before the
  original content is considered private in production.
- Free-plan course-limit checks are not yet an atomic entitlement transaction;
  entitlement enforcement belongs to Milestone 3.
- Account export/deletion is not yet implemented.
- Timetable CRUD after onboarding is incomplete; onboarding capture is working.
- User-semester CRUD is available through API routes; a dedicated semester
  management page is not yet present. Timetable editing after onboarding also
  remains incomplete.
- No remote backup/restore drill has been performed.
- Full production browser E2E awaits preview bindings and email configuration.
- The complete development-tool dependency graph still reports advisories in
  Vite/Miniflare/Wrangler/ESLint transitive packages. Production dependencies
  report zero. Updating the dev toolchain was deferred because a pre-existing
  local Vinext server is actively using those packages and should not be
  terminated without the operator's approval.
