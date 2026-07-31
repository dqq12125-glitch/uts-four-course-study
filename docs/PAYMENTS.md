# Payments

DeepStudy implements web payment infrastructure with Stripe Checkout. It does
not accept an amount, currency, Price ID, or access period from the browser.
The server maps a validated product key to a fixed catalogue entry and a
server-side Stripe Price ID.

## Product catalogue

| Product | Server key | Price | Access |
| --- | --- | ---: | --- |
| Free | `free` | A$0 | No purchase |
| Spring 2026 Founding Pass | `founding_pass` | A$19.00 | Purchase time to `FOUNDING_PASS_ACCESS_END_AT` |
| Semester Pass | `semester_pass` | A$39.90 | Active semester end, otherwise 180 days |
| Exam Sprint | `exam_sprint` | A$11.90 | 14 days |

Amounts are stored as integer minor units (`1900`, `3990`, `1190`) and
currency is stored as `aud`. Semester Pass and Exam Sprint remain hidden until
their feature flags are enabled.

## Environment

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FOUNDING_PASS_PRICE_ID=price_...
STRIPE_SEMESTER_PASS_PRICE_ID=price_...
STRIPE_EXAM_SPRINT_PRICE_ID=price_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
FOUNDING_PASS_ACCESS_END_AT=2026-12-01T00:00:00+11:00
PAYMENTS_MOCK_ENABLED=false
```

`PAYMENTS_MOCK_ENABLED=true` is accepted only by explicit
development/automated-test configuration. Do not use it in preview or
production.

## Checkout flow

1. An authenticated user sends only `{ "productKey": "founding_pass" }` to
   `POST /api/billing/checkout`.
2. The server checks `payments_enabled`, product visibility, Price ID,
   entitlement period, and the user.
3. A pending `purchases` row is created with the server catalogue amount.
4. Stripe Checkout receives `user_id`, `product_key`, and access metadata.
5. Stripe calls `POST /api/webhooks/stripe`.
6. The webhook signature and timestamp are verified against the raw body.
7. `checkout.session.completed` must contain the exact server amount,
   currency, product, user, and unexpired access period.
8. The purchase becomes active and entitlement recalculates immediately.

Webhook processing is idempotent through
`payment_webhook_events(provider, provider_event_id)`. A repeated ID with the
same payload is acknowledged without creating another purchase. Payload hashes
also prevent a failed event ID from being retried with different content.

## Supported webhook events

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Unknown event types are recorded as ignored. Provider errors are returned with
the common API error shape; Stripe payloads and secrets are not logged.

## Customer Portal

`POST /api/billing/portal` creates a Stripe Customer Portal session only when a
stored provider customer ID exists. The first-phase products are one-time
passes, while subscription rows and portal handling are retained for future
subscription support.

## Local Stripe testing

Use Stripe test mode:

```powershell
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the emitted `whsec_...` value into `.dev.vars`, set test Price IDs, start
DeepStudy, and use `/pricing`. Verify:

- success redirects to `/app/settings/billing?checkout=success`;
- cancellation returns to `/pricing?checkout=cancelled`;
- the active purchase has the exact server amount;
- a repeated webhook does not duplicate the purchase;
- a mismatched amount fails closed;
- refunds remove active purchase entitlement;
- a Free user cannot add a second course before payment and can after payment.

Automated coverage is in:

- `tests/milestone3-unit.test.mjs`
- `tests/milestone3-integration.test.mjs`
- `tests/milestone3-http-e2e.test.mjs`

## Native apps

The iOS/Android app reads server-owned entitlements and purchase history. It
does not embed a Stripe digital-goods checkout button. Store-distributed
digital access needs Apple/Google product configuration and a policy-compliant
in-app purchase adapter before sale inside the native binary.

No App Store or Play billing product is configured by this repository.

## Operational checklist

- Use distinct test and live Price IDs.
- Keep all live secret values in the Cloudflare secret store.
- Configure the exact production webhook endpoint and rotate leaked secrets.
- Monitor failed `payment_webhook_events`.
- Reconcile Stripe payments against `purchases` before financial reporting.
- Test refunds and expired access in preview.
- Do not enable `payments_enabled` in production until the legal entity,
  receipts, tax treatment, support, and refund process are confirmed.

