# Privacy and Data

> **LEGAL REVIEW REQUIRED**

This document describes the implemented data behaviour. It is not legal
advice, and the public privacy/terms pages must be reviewed for the operating
entity and production vendors before launch.

## Data collected

- account email, verification time, display name, language, time zone, role,
  status, and settings;
- institution, semester, course, timetable, deadline, topic, and task data;
- focus sessions, practice answers, error type, confidence, mastery, and review
  schedule;
- private uploads plus extracted proposals;
- private AI conversations and token/cost metadata;
- purchase/subscription state;
- notification preferences and delivery state;
- minimal product events and administrative audit records.

Password data is not collected because authentication uses one-time Magic
Links. UTS/Canvas credentials are never requested or stored.

## Why data is used

Data is used to authenticate the account, create a personal daily plan,
deliver learning practice, calculate evidence-based mastery, schedule retests,
process purchases, send requested reminders, prevent abuse, support account
operations, and understand aggregate product reliability.

## Isolation

Student entities carry `user_id`, and repository reads/writes repeat the
authenticated owner predicate. Cross-user course, assessment, topic, task,
practice, mastery, conversation, resource, notification, and purchase access is
covered by integration/HTTP tests.

Public templates contain only curated template metadata and reviewed original
questions. A user's uploaded material or generated private question is not
promoted to public content automatically.

## Uploaded files

- Maximum size: 10 MB.
- Allowed: PDF, JPEG, PNG, WebP, text/Markdown, and ICS.
- Extension, declared MIME type, and content signature are validated.
- Storage keys use an unpredictable user/resource namespace.
- The R2 bucket is private; downloads go through an authenticated owner route.
- Extracted dates/classes/topics are proposals and require explicit selection
  before database insertion.
- `retention_until` supports lifecycle handling.

Individual deletion hides the record immediately and schedules physical object
deletion. The hourly job retries cleanup and removes extraction data. Full
account deletion deletes private objects first; if object deletion fails, the
database account deletion does not proceed.

## AI and model training

DeepStudy does not automatically share private course material with other
users and does not use private uploads to train a public model. Selected
private context may be sent to the configured AI provider solely to perform the
requested tutor/extraction operation. Production policy must name the actual
provider, region, subprocessors, retention, and opt-out terms.

## Analytics

`usage_events.properties_json` is schema-sanitised. It must not contain:

- full course resources;
- full AI conversations;
- passwords or tokens;
- direct payment details;
- raw IP addresses.

Operational rate limiting stores a secret-keyed hash rather than the raw IP.

## Email and reminders

Each reminder category can be disabled. Marketing is off by default. Reminder
emails include an expiring signed one-click unsubscribe URL; the confirmation
GET does not unsubscribe, while the token-authenticated POST disables email
reminders. In-app review signals continue to work.

## Export and deletion

Users can:

- export a structured JSON copy of account/product data;
- delete an individual upload;
- type `DELETE` to delete the account and personal data.

Exports intentionally exclude authentication tokens and storage keys. Account
deletion records a minimal tombstone audit/event without retaining the
student's private content.

## Third parties to disclose before launch

- Cloudflare Workers, D1, R2, and related delivery/security services;
- the configured transactional email provider;
- Stripe for web payments;
- the configured AI provider;
- Apple and Google for native distribution and, if enabled, native purchases;
- Turnstile when enabled.

## Retention and backups

Operational timestamps are UTC. Application records remain until account
deletion or a documented lifecycle process applies. D1/R2 backups and provider
logs may persist for their configured recovery window; exact production
windows must be added to the legal notice before launch.

## Security contacts and data requests

The production privacy page must include the legal operator name, contact
address, jurisdiction, complaint route, and response process. Placeholders are
not sufficient for public release.

DeepStudy is an independent student-built service. It is not affiliated with,
sponsored by, or endorsed by the University of Technology Sydney.

