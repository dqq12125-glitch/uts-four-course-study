# Milestones 3–5 Implementation Report

## Milestone 3 — Commercialisation

Implemented:

- server product catalogue with integer AUD minor-unit prices;
- Free, Founding Pass, Semester Pass, and Exam Sprint entitlement structures;
- server checks for course, AI, practice, upload, mastery, and report access;
- Stripe Checkout, Customer Portal support, signature verification, event
  idempotency, refund/subscription synchronisation, and purchase analytics;
- pricing and billing pages;
- payment unit, integration, and HTTP tests.

External configuration still required:

- Stripe account, products/Prices, webhook endpoint, live credentials;
- refund/tax/support policy;
- native store billing products if digital access is sold inside the apps.

## Milestone 4 — AI tutor and private resources

Implemented:

- AI provider abstraction and explicit unavailable/mock adapters;
- Hint-first and academic-integrity safety modes;
- user/course/topic/task context ownership checks;
- daily/weekly/context/monthly-cost limits and safe usage logs;
- private PDF/image/text/ICS validation and R2 storage abstraction;
- text/ICS extraction proposals with explicit confirmation;
- private generated questions and cross-user isolation tests.

External configuration still required:

- production AI provider/model/data-processing review;
- private R2 binding;
- production parsing strategy for image/PDF extraction at intended scale.

## Milestone 5 — Release preparation

Implemented:

- independent bilingual marketing, pricing, legal-placeholder, and app pages;
- admin dashboard and environment feature flags;
- timezone-aware in-app/email reminders, retry state, unsubscribe flow, and
  scheduled-job records;
- weekly reports, export, individual file deletion, and full account deletion;
- structured API errors, request IDs, error boundaries, and safe logs;
- iOS/Android Expo app for the core SaaS loop;
- Universal/App Link association endpoints;
- mobile icon, adaptive icon, splash assets, secure session storage, and
  native file sharing/upload;
- release-oriented unit, integration, HTTP, mobile API, and native unit tests.

External/human work still required:

- production D1/R2/email/AI/Stripe/Turnstile secrets and bindings;
- legal/privacy/academic-integrity review;
- real-device accessibility, email-client, deep-link, and payment QA;
- Apple/Google developer accounts, signing, store metadata, IAP products, and
  submission;
- production rollout and monitoring.

## Preserved personal workspace

The original four-course app remains at `/personal`. Access requires the exact
verified `PERSONAL_OWNER_EMAIL`; blank configuration fails closed. Legacy
browser `localStorage` progress remains on the same origin and is not migrated
into templates or other users' data.

## Open-course result

Any student can create a course using only a course name. Institution,
template, course code, instructor, timetable, assessments, topics, and
resources are optional. Planning, practice, mastery, reporting, and AI context
use the user's course ID rather than one of the original four subject keys.

## Final verification — 30 July 2026

- Web/backend production build: passed.
- Web/backend TypeScript and ESLint: passed.
- Complete web/backend suite: 78 passed, 0 failed.
- Native TypeScript and ESLint: passed.
- Native tests: 8 passed, 0 failed.
- Expo Doctor: 20/20 checks passed.
- Android and iOS platform exports: passed.
- Local D1 migrations `0000` through `0006`: applied successfully.
- Browser QA: 320, 375, 390, 430, 768, 1024, and 1440 px widths checked;
  no document-level overflow was found on the public or core app routes.
- Keyboard/focus/accessibility smoke checks: no unnamed controls, positive
  `tabindex`, non-native button roles, or heading-level gaps were found on the
  sampled routes; visible focus and reduced-motion rules were present.
- Web/backend production dependency audit: 0 known vulnerabilities.
- Secret-pattern scan: no live/test Stripe keys, webhook secrets, cloud keys,
  Google API keys, or private-key blocks found in repository source.

The mobile dependency tree still reports 12 moderate advisories in transitive
Expo/Xcode build tooling. `npm audit` proposes incompatible SDK downgrades, so
no destructive forced fix was applied. The web development tree separately
reports ESLint/Drizzle advisories that are not present in the production-only
audit.
