# Product Analytics

DeepStudy records a small first-party event set in D1. It does not require an
invasive third-party behavioural tracker.

## Event catalogue

| Funnel | Events |
| --- | --- |
| Acquisition | `user_signed_up`, `email_verified` |
| Activation | `onboarding_started`, `onboarding_completed`, `first_plan_generated` |
| Course setup | `course_created`, `assessment_created` |
| Daily execution | `study_task_started`, `study_task_completed`, `focus_session_completed` |
| Learning loop | `practice_started`, `practice_completed`, `review_completed`, `ai_tutor_used` |
| Commerce | `paywall_viewed`, `checkout_started`, `purchase_completed`, `purchase_failed` |
| Privacy | `account_deleted` |

Server-owned events are written from the operation that changes state. The two
view events (`onboarding_started`, `paywall_viewed`) may be sent by the client
but pass a strict server allowlist and property sanitiser.

## Property rules

Allowed properties are compact identifiers or state labels needed for
analysis, such as product key, course ID, model key, and safety mode. Never put
full course content, uploaded text, AI transcripts, raw IPs, authentication
tokens, or payment instrument data in `properties_json`.

## Admin metrics

The admin dashboard calculates:

- total/new/onboarded/active users;
- paid users and revenue;
- onboarding completion rate;
- Free-to-paid conversion;
- 7-day and 28-day activity;
- weekly completed tasks and practice attempts;
- due/completed retests and review completion rate;
- paid-user activity rate;
- AI calls, tokens, estimated cost, and cost per active user;
- completed/refunded purchases and refund rate;
- error summaries and scheduled-job health.

Ratios return zero when the denominator is zero. Monetary values use integer
minor units.

## Interpretation cautions

- Mastery scores are learning heuristics, not exam predictions.
- “Active” is based on recorded product evidence in a defined window, not an
  invisible device tracker.
- Conversion metrics need enough cohort time; do not compare an incomplete
  week with a mature cohort without labelling it.
- AI cost is an estimate derived from configured per-million-token inputs.
- Deleted accounts no longer contribute identifiable private records.

## Query and reporting policy

- Use UTC for stored event instants and explicit local windows when presenting
  user-day metrics.
- Document the denominator and time window for every exported KPI.
- Prefer aggregate counts; do not export row-level student learning data for
  marketing.
- Review any new event/property in code and this document before release.

