# DeepStudy

DeepStudy is a mobile-first semester execution system for university students:
**Turn your semester into today’s next step.** Students can use any course from
any institution; the four original UTS subjects remain optional starter
templates rather than product assumptions.

This repository contains:

- a Cloudflare Worker/Vinext web application;
- a D1 relational data model with repeatable Drizzle migrations;
- private R2-backed resource ingestion;
- Stripe web checkout and server-owned entitlements;
- a Hint-first AI provider layer with academic-integrity controls;
- scheduled in-app/email reminders and weekly reports;
- an admin operations surface;
- an Expo/React Native iOS and Android app under `apps/mobile`;
- the original four-course personal workspace at `/personal`, protected by a
  server-side owner allowlist.

The native apps are implemented and exportable, but this repository has not
been submitted to App Store Connect or Google Play. Store accounts, signing,
store product configuration, legal review, and real-device release approval
remain external release gates.

## Product routes

| Area | Routes |
| --- | --- |
| Marketing and pricing | `/`, `/pricing` |
| Passwordless authentication | `/auth/sign-up`, `/auth/sign-in`, `/auth/verify` |
| Student setup | `/onboarding` |
| Daily execution | `/app/today`, `/app/plan` |
| Open courses | `/app/courses`, `/app/courses/:courseId` |
| Practice and mastery | `/app/practice`, `/app/practice/:sessionId`, `/app/mastery` |
| Hint-first tutor and resources | `/app/tutor`, `/app/resources` |
| Settings | `/app/settings/profile`, `/study`, `/privacy`, `/billing` |
| Reminders and reports | `/app/notifications`, `/app/reports/weekly` |
| Administration | `/admin` |
| Legal placeholders | `/legal/privacy`, `/legal/terms`, `/legal/academic-integrity` |
| Private legacy workspace | `/personal` |

## Prerequisites

- Node.js `>=22.13.0`
- npm
- a Cloudflare account for remote D1/R2/Worker deployment
- a verified email sender for preview/production authentication and reminders
- Stripe, AI provider, and Turnstile credentials only when those integrations
  are enabled
- Android Studio/device or an iOS development build for native testing

## Local web development

```powershell
npm install
Copy-Item .env.example .dev.vars
npm run db:migrate:local
npm run dev
```

Use `APP_ENV=development` and an exact `APP_BASE_URL`. When no email provider
key is configured, development authentication returns a clearly labelled
local-only Magic Link preview. Preview and production never expose that link.

Local D1 uses `wrangler.local.jsonc` and the ignored `.wrangler/state`
directory.

## Mobile development

```powershell
npm install --prefix apps/mobile
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run start --prefix apps/mobile
```

Set `EXPO_PUBLIC_API_BASE_URL` to a backend URL reachable from the device.
Android emulators commonly use `http://10.0.2.2:3000`; physical devices need a
LAN address or HTTPS preview URL. Native sessions are stored in secure storage,
not AsyncStorage.

Production Magic Links use Universal Links/App Links after the team ID and
certificate fingerprints are configured. The custom `deepstudy://` scheme is
retained as a development fallback.

## Environment variables

Copy `.env.example`; never put a secret in a `PUBLIC_` or `EXPO_PUBLIC_`
variable.

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `development`, `preview`, `production`, or `test` |
| `APP_BASE_URL` | Canonical web origin for links and redirects |
| `MOBILE_APP_SCHEME` | Development native callback scheme |
| `MOBILE_APP_LINK_BASE_URL` | Canonical HTTPS mobile-link origin |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | Magic Links and reminder delivery |
| `UNSUBSCRIBE_TOKEN_SECRET` | HMAC secret for expiring email-unsubscribe links |
| `IP_HASH_SECRET` | Non-reversible IP hashing for abuse controls |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_REQUIRED` | Optional anti-abuse challenge |
| `PERSONAL_OWNER_EMAIL` | Exact account allowed to access `/personal`; blank disables it |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL` | AI provider selection and credentials |
| `AI_TUTOR_MODEL`, `AI_EXTRACTION_MODEL` | Server-selected model keys |
| `AI_*_COST_PER_MILLION_MINOR_USD` | Cost estimation inputs |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe server credentials |
| `STRIPE_*_PRICE_ID` | Server-owned Stripe Price IDs |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public Stripe key, if needed by a future client flow |
| `FOUNDING_PASS_ACCESS_END_AT` | Server-owned Founding Pass expiry |
| `APPLE_TEAM_ID` | Generates Apple app association data |
| `ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS` | Generates Android asset links |

`AI_MOCK_ENABLED`, `UPLOADS_MOCK_ENABLED`, and `PAYMENTS_MOCK_ENABLED` are for
development/automated tests only and must stay false in production.

## Database migrations

After changing `db/schema.ts`:

```powershell
npm run db:generate
npm run db:migrate:local
```

Apply all ordered SQL files under `drizzle/` to the bound remote D1 database
before deploying compatible code. Migrations are additive/forward-only; take a
D1 backup/bookmark before remote application.

See [Database](./docs/DATABASE.md).

## Validation

Web/backend:

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
npm run build
```

Native:

```powershell
npm run typecheck --prefix apps/mobile
npm run lint --prefix apps/mobile
npm test --prefix apps/mobile
npm run doctor --prefix apps/mobile
npx expo export --platform android --output-dir dist-android
npx expo export --platform ios --output-dir dist-ios
```

Test adapters are explicit: in-memory D1-compatible SQLite, mock payment/AI,
and in-memory private storage are enabled only by test/development
configuration. Passing tests do not prove real Stripe, email, AI, R2, signing,
or store accounts are configured.

## Stripe local testing

1. Set the Stripe test secret, webhook secret, and server-side Price IDs.
2. Keep `payments_enabled` on in development.
3. Forward Stripe CLI events to `/api/webhooks/stripe`.
4. Complete a test Checkout from `/pricing`.
5. Confirm `/app/settings/billing` shows the active entitlement.
6. Replay the same event and confirm it is recorded as a duplicate.

Detailed commands and supported events are in
[Payments](./docs/PAYMENTS.md).

## Cron testing

Production runs the Worker scheduled handler hourly (`0 * * * *`). In
development, an admin can invoke the same job through
`POST /api/admin/jobs/run`; the endpoint requires an authenticated admin and
the server-side admin feature flag.

The job creates timezone-aware reminders, sends/retries email deliveries,
deduplicates scheduled work, cleans physically deleted resources, and records
its result in `scheduled_job_runs`.

## Creating the first administrator

There is deliberately no public “make admin” endpoint. Register and verify the
account normally, then update its role using an authenticated operational D1
session:

```sql
UPDATE users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = lower('owner@example.com')
  AND status = 'active'
  AND deleted_at IS NULL;
```

Verify exactly one row changed, sign out, sign in again, and audit access to
`/admin`. See [Admin operations](./docs/ADMIN_OPERATIONS.md).

## Deployment and native release

- [Deployment](./docs/DEPLOYMENT.md)
- [Mobile architecture](./docs/MOBILE_ARCHITECTURE.md)
- [Mobile build and release](./docs/MOBILE_BUILD_AND_RELEASE.md)
- [Use on an iPhone before publication](./docs/IPHONE_LOCAL_TESTING.md)
- [App store readiness](./docs/APP_STORE_READINESS.md)
- [Release readiness](./docs/RELEASE_READINESS.md)

No production deployment or store submission is performed by the repository
itself.

## Documentation

- [Commercialization specification](./COMMERCIALIZATION_SPEC.md)
- [Codebase audit](./docs/CODEBASE_AUDIT.md)
- [Migration plan](./docs/MIGRATION_PLAN.md)
- [Timetable import](./docs/TIMETABLE_IMPORT.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Authentication](./docs/AUTH.md)
- [Database](./docs/DATABASE.md)
- [Payments](./docs/PAYMENTS.md)
- [AI safety](./docs/AI_SAFETY.md)
- [Privacy and data](./docs/PRIVACY_AND_DATA.md)
- [Product analytics](./docs/PRODUCT_ANALYTICS.md)
- [Admin operations](./docs/ADMIN_OPERATIONS.md)
- [Testing](./docs/TESTING.md)
- [Milestone 1 report](./docs/MILESTONE_1_REPORT.md)
- [Milestone 2 report](./docs/MILESTONE_2_REPORT.md)
- [Milestones 3–5 report](./docs/MILESTONES_3_TO_5_REPORT.md)
