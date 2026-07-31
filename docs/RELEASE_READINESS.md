# Release Readiness

Status: **code-complete for pre-release validation; not production-configured
or published**.

## Implemented gates

- strict TypeScript for web/backend and native client;
- repeatable D1 migrations;
- server-side validation and uniform API errors;
- ownership checks and cross-user isolation coverage;
- passwordless Magic Links, expiring sessions, secure cookies, bearer exchange
  for native, rate limiting, and optional Turnstile;
- server-owned entitlement, price, webhook, AI limit, and file rules;
- account export/deletion and private-resource deletion;
- scheduled reminders/retries and job records;
- bilingual responsive web and native core workflows;
- production web build and platform-neutral Expo exports.

## External blockers

- real production D1/R2 bindings and migration backup;
- canonical independent domain and verified Universal/App Links;
- verified Resend sender and unsubscribe secret;
- Stripe live products/webhook and policy review;
- AI provider credentials/model/data-retention review;
- Turnstile production keys when enforcement is enabled;
- administrator provisioning;
- Apple/Google signing, store billing, metadata, screenshots, privacy forms,
  review, and publication;
- legal review of all placeholder terms.

## Known non-blocking engineering follow-up

- Vinext reports a client chunk larger than 500 kB. The build succeeds, but the
  bundle should be measured on lower-end phones and split before a high-traffic
  launch if it affects startup.
- Full `npm audit` includes development-tool advisories in ESLint/Drizzle
  dependency trees that currently require disruptive upstream changes.
  Production-only web/backend audit is clean after updating RSC/Vite/Cloudflare
  tooling. Expo's npm tree reports moderate build-tool advisories; Expo Doctor
  and exports must remain release gates while awaiting compatible upstream
  fixes.
- Real-device screen reader, keyboard, reduced-motion, background timer, and
  email-client deep-link checks cannot be proven by unit tests.

## Go/no-go checklist

Before public launch, all must be true:

- migrations applied to a backed-up production D1;
- two-account isolation smoke test passes in production-like preview;
- production feature flags enable only configured services;
- Magic Links and unsubscribe work from common mail clients;
- payment success/failure/refund/replay paths reconcile;
- AI red-team cases pass in Chinese and English;
- resource bucket is private and deletion is observed;
- legal/operator/support contacts are final;
- iOS and Android real-device test matrices pass;
- rollback owner and previous compatible Worker/native builds are identified.

The excluded action for this work is actual App Store/Google Play publication.

