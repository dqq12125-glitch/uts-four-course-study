# Authentication

DeepStudy uses passwordless email Magic Links. It does not collect or store a
password.

## Web flow

1. `POST /api/auth/request-link` validates/normalises the email and intent.
2. Optional Turnstile verification runs when enforcement is enabled.
3. Persistent D1 rate limits check secret-keyed email/IP buckets.
4. A cryptographically random one-time token is generated; only its SHA-256
   hash is stored.
5. The email provider sends a 15-minute link.
6. `/api/auth/verify` consumes it exactly once.
7. The user is created/verified and a 30-day hashed session is stored.
8. The raw session token is set in an `HttpOnly`, `SameSite=Lax` cookie;
   production also uses `Secure`.

Sign-in for an unknown email returns the same public response as a known email
and sends no link, reducing account enumeration.

## Native flow

1. The app requests a link with `client=mobile`.
2. Development uses `deepstudy://auth/callback`; release uses the configured
   verified HTTPS Universal/App Link.
3. The app POSTs the one-time token to `/api/auth/mobile/exchange`.
4. The token is consumed and a 30-day bearer session is returned once.
5. The app stores it in Expo SecureStore.
6. API calls use `Authorization: Bearer`.
7. Sign-out revokes the server record and clears secure storage.

The session token is never placed in the callback URL. Replaying the exchange
token fails.

## Routes

- `/auth/sign-up`
- `/auth/sign-in`
- `/auth/verify`
- `/auth/forgot-password`
- `/auth/reset-password`
- `POST /api/auth/request-link`
- `GET /api/auth/verify`
- `POST /api/auth/mobile/exchange`
- `GET /api/auth/session`
- `POST /api/auth/sign-out`

Forgot/reset pages explain the passwordless recovery model and request a new
Magic Link.

## CSRF and request security

Cookie-authenticated state-changing routes validate `Origin` when present,
require JSON/form contracts, and benefit from `SameSite=Lax`. Native bearer
requests do not rely on ambient cookies, so cookie CSRF origin checks do not
apply; session validation and ownership checks still run.

Security headers and API responses avoid reflecting raw tokens, provider
secrets, stack traces, or database details.

## Rate limiting and Turnstile

Rate-limit state persists in D1. IP values are transformed with
`IP_HASH_SECRET`; raw IPs are not stored in analytics.

Turnstile is optional:

```dotenv
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
TURNSTILE_REQUIRED=false
```

When `TURNSTILE_REQUIRED=true`, the server fails closed if verification cannot
be completed. Keep enforcement off until the web/mobile challenge UX and keys
are configured.

## Development and production

Development without an email key returns a labelled preview URL in the
authentication response. It is never returned in preview/production.

Preview/production require:

- canonical `APP_BASE_URL`;
- email provider key and verified sender;
- high-entropy `IP_HASH_SECRET`;
- high-entropy `UNSUBSCRIBE_TOKEN_SECRET` for reminder emails;
- verified mobile app links for store release.

## Personal owner authorization

`/personal` requires both:

1. a valid Magic Link session;
2. an exact, case-insensitive match to server-only `PERSONAL_OWNER_EMAIL`.

Blank configuration fails closed. Non-owners receive `404`, and the configured
email is never sent to browser code.

## Account lifecycle

Multiple devices may hold independent sessions. Sign-out revokes the current
session. Full account deletion removes private objects, deletes user-owned D1
data through cascades/explicit cleanup, and invalidates sessions.

