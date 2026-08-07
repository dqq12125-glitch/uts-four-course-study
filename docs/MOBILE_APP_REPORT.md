# Mobile App Foundation Report

Date: 2026-07-30

## Implemented

- Expo/React Native strict-TypeScript app for iOS and Android
- Native routing, bottom navigation, safe areas, dark/light readability
- Email Magic Link request for mobile clients
- One-time HTTPS token exchange and Keychain/Keystore-backed session storage
- Bearer authentication for existing Worker APIs
- Open-course onboarding with optional course code
- Native Today page and server-timed focus flow
- Native Courses, hint-first Practice, and Mastery pages
- Private question creation for any user-owned course
- First-wrong retry without answer leakage or false mastery increase
- Error classification, confidence reflection, and due-retest launch
- Mobile HTTP API endpoints for Today, Practice, and Mastery
- Cross-user read/write isolation tests

The `/personal` web workspace and its same-origin `localStorage` remain
unchanged and are not imported into the mobile App.

## Validation

- Mobile strict TypeScript: passed
- Mobile Expo ESLint: passed
- Mobile unit tests: 5 passed
- Expo Doctor: 20/20 checks passed
- Android Metro/Hermes bundle export: passed
- iOS Metro/Hermes bundle export: passed
- Worker unit tests: 19 passed
- Worker integration tests: 9 passed
- Worker E2E tests, including mobile auth/isolation: 4 passed
- Worker production build: passed

## Not completed

- App Store or Play Store publication
- EAS project and signing credential setup
- TestFlight/Play internal builds and real-device QA
- Universal Links and Android App Links
- Final bundle/application identifiers and store assets
- Native billing, AI tutor, uploads, notifications, offline mode, account
  deletion/export UI, full English localization, and full course/Assessment
  CRUD

## Known risks

- `npm audit` reports transitive Expo tooling advisories; no high/critical
  runtime fix was applied by downgrading Expo. Recheck against newer compatible
  SDK 57 patches before release.
- The custom callback scheme can be claimed by another installed app; verified
  links are required for production.
- A mobile session is a bearer credential. SecureStore reduces local exposure,
  but rooted/jailbroken devices remain outside the trust boundary.
- The production Worker/D1/email stack is not configured, so store builds
  cannot complete a real login yet.
- Store payment policy needs a deliberate decision during Milestone 3.
