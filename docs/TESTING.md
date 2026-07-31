# Testing

## Commands

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

Set-Location apps/mobile
npx expo export --platform android --output-dir dist-android
npx expo export --platform ios --output-dir dist-ios
```

## Unit coverage

- explainable task priority, daily capacity, overload, and rebalancing;
- arbitrary/open-course plan generation;
- UTC/local dates, Sydney cross-day and daylight-saving behaviour;
- first correct/wrong/supported/delayed practice and spaced intervals;
- server product amounts, access periods, entitlements, and checkout input;
- Stripe signature verification;
- Hint-first integrity detection and prompt safety;
- private upload MIME/extension/signature/size and ICS parsing;
- study streak, Turnstile fail-closed behaviour, and signed unsubscribe tokens.

## Integration coverage

- migration application and safe optional template seed;
- hashed/expiring Magic Link/session and anti-enumeration rate limits;
- custom institution/open course onboarding;
- course/assessment/class/topic/task CRUD and ownership;
- focus, practice, mastery, retest, and plan rebalance;
- payment activation/replay/mismatch/refund-related state and isolation;
- AI context/limits/logging and private resource confirmation;
- reports, notifications, retries/deduplication, export, file/account deletion;
- user A/user B isolation across academic, learning, AI, resource, commerce,
  notification, and privacy operations.

## HTTP/E2E coverage

- Free registration → onboarding → assessment → Today → task completion;
- paid checkout/webhook → entitlement → second course;
- wrong answer → minimal hint → retry → reflection → mastery → due retest;
- user B cannot read/change/delete user A records;
- server-rendered bilingual application pages;
- admin role enforcement and dashboard rendering;
- well-known iOS/Android app-link responses;
- email unsubscribe confirmation/POST;
- native Magic Link exchange, bearer API, sign-out, and isolation.

## Test adapters

Tests use:

- Node's in-memory `node:sqlite` adapter with D1-compatible methods;
- explicit mock Stripe/AI adapters;
- in-memory private object storage;
- built Worker output for HTTP tests.

These adapters prove application behaviour, not the existence of production
Cloudflare, Stripe, email, AI, Apple, or Google credentials.

Node may print an experimental warning for `node:sqlite`; it is test-only.

## Manual release matrix

Automated tests cannot replace:

- Chrome/mobile-width visual and keyboard checks;
- VoiceOver/TalkBack and dynamic text;
- physical-device timer background/lock behaviour;
- real email-client Universal/App Links;
- real Stripe test-mode and refund reconciliation;
- private R2 access/deletion;
- AI red-team review in Chinese and English;
- TestFlight/Play internal testing.

## Security/dependency checks

```powershell
npm audit --omit=dev
npm audit --prefix apps/mobile --omit=dev
git diff --check
```

Do not run `npm audit fix --force` without reviewing framework compatibility.
Record unresolved build-tool advisories in `RELEASE_READINESS.md`.

## Current validated result

The final exact pass/fail counts and platform export result for this working
tree are recorded in the implementation handoff and should be refreshed after
any code, dependency, migration, or environment change.

