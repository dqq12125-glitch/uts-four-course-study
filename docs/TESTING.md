# Testing

## Commands

Web/backend:

```powershell
npm run typecheck
npm run lint
npm run test:contracts
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
npm run build
```

Native:

```powershell
npm run typecheck:mobile
npm run lint:mobile
npm run test:mobile
npm run doctor --workspace @deepstudy/mobile

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
- shared Web/Native response contracts and common API error parsing;
- Zod-validated AI output, capability-based model selection, object-storage
  compatibility, job retries/idempotency, and connector-key rotation;
- PostgreSQL migration shape, pgvector/HNSW declarations, and D1 export
  ownership/count/checksum manifests.
- Mock/Manual/Canvas Connector contracts, Canvas opaque pagination and GET-only
  behavior;
- PDF page/PPTX slide/text section locators, document hashes, embedding shape,
  and legacy `.ppt` failure semantics.

## PostgreSQL contract

Static checks do not claim that a live PostgreSQL server exists. Run the
following against a disposable PostgreSQL instance with pgvector installed:

```powershell
npm run db:check:postgres
$env:POSTGRES_URL = "postgresql://..."
npm run db:migrate:postgres
npm run db:verify:postgres
```

`.github/workflows/postgres-contract.yml` applies all migrations to two
independent empty PostgreSQL 16 databases and verifies the vector extension,
`vector(1536)` column, HNSW index, and expected table count. A D1 snapshot is
staged before normalization so row-count and ownership failures stop the
transaction instead of producing a partial cutover.

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
- versioned resource dual-write, same-file deduplication, changed-chunk embedding
  reuse, persistent retry, sync logs, and source tombstones.

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
- version status API, HTTP upload deduplication, and missing-connection sync
  failure contract.

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
git diff --check
```

Do not run `npm audit fix --force` without reviewing framework compatibility.
Record unresolved build-tool advisories in `RELEASE_READINESS.md`.

## Current validated result

The final exact pass/fail counts and platform export result for this working
tree are recorded in the implementation handoff and should be refreshed after
any code, dependency, migration, or environment change.
