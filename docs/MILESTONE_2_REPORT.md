# Milestone 2 Stage Report

Date: 2026-07-30

## 1. Actual changes

- Added durable focus sessions with server-derived elapsed time, 15/25/45
  minute presets, custom duration, and post-session reflection.
- Added user-private practice questions for any course, including courses with
  no template or code.
- Added server-owned practice sessions. The first wrong check does not reveal
  the solution or update mastery; the student can request a minimal hint and
  retry.
- Added practice attempts with correctness, hints, prior failed checks, time,
  confidence, and error type.
- Added evidence-based mastery and configurable review intervals.
- Added one-open-retest scheduling and surfaced due retests as the primary
  candidate on Today.
- Added a Mastery page that shows reader-facing bands rather than a false
  precision percentage.
- Added capacity-aware overdue-task rebalancing. Critical tasks are not moved
  until the user confirms.
- Added service-side ownership checks to every new student-data query and
  tested user A/user B isolation through the built Worker.
- Kept the original four-course application unchanged in its separate
  owner-only `/personal` route and same-origin `localStorage` boundary.

## 2. Database

Five Milestone 2 tables were added, bringing the implemented schema to 21
tables:

1. `focus_sessions`
2. `practice_questions`
3. `practice_sessions`
4. `practice_attempts`
5. `mastery_records`

Migrations:

- `0002_curly_starhawk.sql` adds the five tables, topic uniqueness, and the
  one-open-retest index.
- `0003_crazy_jack_murdock.sql` adds server-owned failed-check state and
  one-active-focus/practice indexes.
- `0004_goofy_kid_colt.sql` persists prior failed checks with the completed
  attempt.

The table-rebuild migrations have an integration test that inserts old-format
records before applying the migration and verifies that the data survives with
the new counter initialized to zero.

## 3. Available pages

- `/app/today`
  - due-review alert;
  - focus timer based on an absolute server start time;
  - focus completion reflection;
  - retest-aware primary action;
  - capacity-aware overdue-task rebalance.
- `/app/practice`
  - arbitrary-course selection;
  - private single-choice question and topic creation;
  - resume the current active session.
- `/app/practice/:sessionId`
  - independent first answer;
  - wrong-without-answer-leak response;
  - progressive hints;
  - retry, grading, explanation, error type, and confidence.
- `/app/mastery`
  - due, building, basic, and stable states;
  - recent error type;
  - next review in the user's time zone;
  - direct link to a due retest.

The existing `/app/courses`, onboarding, authentication, and owner-only
`/personal` pages remain available.

## 4. Verification

Final local results:

- TypeScript: passed.
- ESLint: passed.
- Vinext production build: passed.
- Unit: 19 passed, 0 failed.
- Integration: 9 passed, 0 failed.
- E2E: 3 passed, 0 failed.
- Full suite: 53 passed, 0 failed.

The E2E learning-loop test runs against the built Worker and covers:

1. Magic Link registration;
2. arbitrary-course onboarding;
3. private question creation;
4. first wrong answer without solution or mastery leakage;
5. minimal hint;
6. correct retry recorded as supported rather than independent;
7. error metadata, mastery, and retest creation;
8. due review on Today and Mastery;
9. cross-user denial for question, session, attempt, focus, and course-linked
   writes.

## 5. Failed checks

No check remains failing in the final run.

During implementation, two issues were found and fixed before the final run:

- an SSR assertion assumed React would not insert comment separators around a
  dynamic number;
- generated SQLite table-rebuild SQL tried to select a new column from the old
  table. The migration now supplies `0`, and a data-preservation integration
  test guards both rebuilds.

## 6. Manual configuration still required

Milestone 2 introduces no new paid external service. A real preview or
production release still requires:

- a real Cloudflare D1 database bound as `DB`;
- all five migrations applied after a backup;
- canonical `APP_BASE_URL` and `APP_ENV`;
- a verified email sender and production email key;
- a high-entropy `IP_HASH_SECRET`;
- `PERSONAL_OWNER_EMAIL` if the private workspace is enabled;
- preview smoke testing with two real browser profiles.

No remote D1, email provider, Cron trigger, payment provider, AI provider
adapter, or production deployment was configured in this milestone.
The connected Sites project remains on its earlier owner-only version and has
no production runtime environment entries; no Milestone 2 version was saved.

## 7. Recommended next milestone

Proceed to Milestone 3: commercialisation. Implement server-side entitlements,
Founding Pass product configuration, Stripe Checkout, idempotent webhook
handling, purchase records, and billing UI. Preserve the learning-loop service
boundary so every paid limit is enforced on the server.

## 8. Remaining risks and incomplete scope

- `/` still publicly renders the legacy four-course compatibility page. It
  must become the marketing page before public SaaS launch; `/personal` must
  remain unchanged.
- The legacy `/api/tutor` is still anonymous and must be authenticated,
  rate-limited, and entitlement-protected before public release.
- Practice creation currently supports private single-choice questions. Public
  reviewed banks, short-answer grading, and AI-generated practice are later
  scope.
- A retest prefers an unattempted question when the private bank contains one;
  with only one question it performs a fresh attempt without the old answer.
  Generating a guaranteed different question belongs to the later AI provider
  milestone.
- `needs_more_practice` is durably recorded after a focus session but does not
  yet create a new topic task automatically.
- No outbound review email/Cron notification was implemented. Due state remains
  correct in D1 and appears when the user loads Today or Mastery.
- No real-browser QA was run for the new Practice and Mastery screens.
- The build emits a client chunk warning above 500 kB.
- The working tree contains substantial pre-existing, uncommitted work. No
  Sites version or production deployment was created from that mixed state.
