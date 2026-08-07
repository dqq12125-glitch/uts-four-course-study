# Deployment

The repository is deployable, but no production deployment or store
publication is performed by this work. Production services remain fail-closed
until their bindings, secrets, and feature flags are configured.

## Cloudflare bindings

- Worker assets binding: `ASSETS`
- Cloudflare Images binding: `IMAGES`
- D1 binding: `DB`
- private R2 binding: `UPLOADS`
- hourly Cron: `0 * * * *`

`wrangler.jsonc` defines the application/asset/image/Cron shape. Add real D1
and R2 IDs through the deployment control plane; do not commit production
resource identifiers or secrets.

## Required production configuration

Core:

- `APP_ENV=production`
- `APP_BASE_URL=https://<canonical-independent-domain>`
- high-entropy `IP_HASH_SECRET`
- high-entropy `UNSUBSCRIBE_TOKEN_SECRET`
- `PERSONAL_OWNER_EMAIL` if `/personal` should remain available

Authentication/reminders:

- `EMAIL_PROVIDER=resend`
- `EMAIL_API_KEY`
- verified `EMAIL_FROM`

Optional services when enabled:

- Turnstile site/secret keys;
- AI provider key/base URL/models/cost inputs;
- Stripe secret/webhook secret/Price IDs;
- Apple team ID and Android signing fingerprints.

See `.env.example`. Put secrets in the Cloudflare secret store, not
`wrangler.jsonc`.

## Database rollout

1. Create the production D1 database and bind it as `DB`.
2. Create a backup/bookmark.
3. Apply `drizzle/0000` through `drizzle/0006` in order.
4. Verify all tables and migration history.
5. Confirm only UTS and the four optional templates are seeded.
6. Confirm no personal timetable/assessment/progress rows were seeded.
7. Run two-account isolation checks.

Migrations are forward-only. Use compensating migrations, never a destructive
reverse migration on the live database.

## Private storage

Create a non-public R2 bucket and bind it as `UPLOADS`. Verify:

- direct public object access fails;
- authenticated owner download works;
- a second account receives `404`;
- soft deletion hides the resource immediately;
- the scheduled cleanup physically deletes the object;
- account deletion removes all account objects before deleting D1 rows.

## Feature-flag rollout

Preview/production defaults are intentionally off for:

- payments;
- file uploads;
- AI tutor;
- weekly reports;
- hidden products;
- admin dashboard.

Enable one integration at a time after its configuration and smoke test pass.
`practice_generation_enabled` is on by default because private/manual practice
has a deterministic non-provider path.

## Preview smoke test

1. Register two users from separate browser/device profiles.
2. Complete open-course onboarding for unrelated institutions/courses.
3. Add timetable, assessment, topic, and task data.
4. Verify user B cannot read/change/delete user A IDs.
5. Complete focus, wrong practice, hint retry, mastery, and due retest.
6. Verify UTC/local-day behaviour across the Sydney DST boundary.
7. Upload an ICS/text resource and confirm nothing imports before selection.
8. Complete Stripe test checkout and replay/refund events.
9. Verify AI limits and academic-integrity responses.
10. Generate/deliver/unsubscribe/retry reminders.
11. Export data, delete a resource, then delete an account.
12. Verify ordinary users cannot reach admin APIs.
13. Verify only the configured owner can reach `/personal`.

## Worker build and deploy

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

Deploy only the exact reviewed/pushed source state through the connected
Cloudflare/Sites workflow. Record the commit, migration set, flags, and rollback
owner.

## Cron verification

After deployment:

- inspect `scheduled_job_runs`;
- confirm duplicate hourly invocation is ignored;
- verify email retry/backoff state;
- verify no marketing email is sent by default;
- verify user local time controls reminders;
- verify deleted resources are cleaned.

## Native backend gates

Before internal iOS/Android testing:

- canonical HTTPS backend is reachable;
- Universal/App Link association files contain the final signed identities;
- Magic Link redirect works from real mail clients;
- Worker API remains compatible with the previously distributed binary;
- native digital purchase strategy is store-policy compliant.

See `MOBILE_BUILD_AND_RELEASE.md` and `APP_STORE_READINESS.md`.

## Rollback

- Keep the previous Worker version available.
- Keep database changes backward compatible for at least one native version.
- Disable a failing optional integration with its feature flag.
- Stop a native staged rollout or promote the prior compatible build.
- Rotate any exposed provider key immediately.
- Prefer forward repair over deleting production data.

