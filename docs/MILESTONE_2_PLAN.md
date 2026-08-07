# Milestone 2 Implementation Plan

Date: 2026-07-30

## Goal

Complete the first durable learning loop without changing the open-course
contract or the owner-only personal workspace:

1. start a study task and a focus session;
2. attempt a private question, receive a minimal hint after an initial error,
   and retry without answer leakage;
3. record the completed attempt and original error type;
4. update evidence-based mastery;
5. schedule a configurable retest;
6. surface a due retest on Today;
7. rebalance unfinished non-critical work within daily capacity.

## Product and safety boundaries

- Every new query receives the authenticated `userId`.
- User-authored questions remain private to their owner.
- Public questions are eligible only when they are original and reviewed.
- The browser never receives a solution before the attempt is submitted.
- The first wrong check does not reveal a solution or update mastery.
- Hint counts, prior failed checks, and elapsed time are derived from a
  server-owned practice session, not trusted request fields.
- Mastery cannot be increased by a standalone “I know this” action.
- Review times are stored as UTC instants and displayed in the user time zone.
- The four legacy subjects remain available only through `/personal` and do not
  become prerequisites for the generic learning loop.

## File-level changes

### Persistence

- `db/schema.ts`
  - add `focus_sessions`;
  - add `practice_questions`;
  - add `practice_sessions`;
  - add `practice_attempts`;
  - add `mastery_records`;
  - add ownership and review-queue indexes plus range checks.
- `drizzle/0002_*.sql` through `drizzle/0004_*.sql`
  - additive Milestone 2 tables, retry evidence, and active-session indexes;
  - table rebuilds preserve existing rows and initialize new counters to zero.
- `src/repositories/learning-loop-repository.ts`
  - owner-scoped focus, practice, attempt, mastery, review-task, and rebalance
    persistence.
- `src/application/runtime.ts`
  - expose the new repository/service boundary.

### Domain

- `src/domain/mastery/review-policy.ts`
  - configurable intervals and score deltas.
- `src/domain/mastery/mastery-calculator.ts`
  - evidence-weighted mastery and confidence update.
- `src/domain/mastery/review-interval.ts`
  - 18/36/48/96/168/336-hour interval selection.
- `src/domain/mastery/review-queue.ts`
  - due-state and reader-facing mastery bands.
- `src/domain/planning/plan-rebalancer.ts`
  - capacity-aware overdue-task placement with explicit critical warnings.

### Application services and validation

- `src/application/learning-loop-service.ts`
  - orchestrate focus start/finish, practice sessions, attempt grading,
    mastery updates, retest tasks, and error metadata.
- `src/application/plan-rebalance-service.ts`
  - apply deterministic rebalance decisions only to owned tasks.
- `src/lib/schemas.ts`
  - validate focus, question, practice, attempt, and rebalance inputs.

### HTTP routes

- `app/api/focus-sessions/route.ts`
- `app/api/focus-sessions/[sessionId]/route.ts`
- `app/api/practice/questions/route.ts`
- `app/api/practice/sessions/route.ts`
- `app/api/practice/sessions/[sessionId]/route.ts`
- `app/api/practice/sessions/[sessionId]/hint/route.ts`
- `app/api/practice/sessions/[sessionId]/attempt/route.ts`
- `app/api/practice/attempts/[attemptId]/route.ts`
- `app/api/plan/rebalance/route.ts`

All writes retain same-origin checks and the unified API error format.

### Product pages

- `app/app/today/page.tsx`
  - due-review indicator;
  - absolute-time focus timer;
  - retest-aware primary action;
  - plan-rebalance action.
- `app/app/today/focus-timer.tsx`
- `app/app/today/rebalance-button.tsx`
- `app/app/practice/page.tsx`
  - course selection, private question creation, and session start.
- `app/app/practice/[sessionId]/page.tsx`
- `app/app/practice/[sessionId]/practice-runner.tsx`
  - progressive hints, answer submission, feedback, error classification.
- `app/app/mastery/page.tsx`
  - mastery bands, weak topics, and due/next reviews without false precision.
- `app/app/layout.tsx`
  - add Practice and Mastery navigation.
- `app/saas.css`
  - extend the existing calm workbench visual system; preserve mobile-first
    44–48 px controls and reduced-motion behavior.

## Tests

### Unit

- first correct and first wrong;
- correct after hints;
- correct/incorrect delayed review;
- three consecutive correct attempts;
- long-unpractised review due;
- UTC review timing across Sydney day and DST changes;
- capacity-aware rebalance and explicit critical warning;
- input validation and mastery-band boundaries.

### Integration

- focus session ownership and server-derived elapsed time;
- private question/session/attempt creation;
- migration upgrades preserve existing session and attempt rows;
- attempt updates mastery and creates one retest task;
- wrong attempt records error metadata;
- due retest appears in Today;
- non-owner cannot read, hint, submit, edit, or complete another user’s loop;
- repeated review scheduling updates rather than duplicates the open retest.

### E2E

- onboarding → create private question → start practice → submit wrong answer
  without answer leakage → request hint → retry → classify the original error
  → mastery/retest created;
- advance test time → due retest appears on Today;
- second user receives `404` for the question, session, attempt, and focus
  session.

## Rollback

- The migration sequence adds tables, columns, and indexes. SQLite rebuilds
  the two new Milestone 2 session/attempt tables to install their checks; an
  upgrade test verifies row preservation.
- Existing Milestone 1 routes do not require new records to render.
- New navigation links can be removed independently while retaining data.
- The review policy is code configuration and can be rolled back without
  rewriting historical attempts.
- Do not drop Milestone 2 tables during application rollback; use a forward
  migration if a schema correction is needed.
