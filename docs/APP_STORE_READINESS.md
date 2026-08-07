# App Store Readiness

DeepStudy uses Expo/React Native and is not a WebView wrapper. The repository
contains one shared TypeScript application targeting iOS and Android.

## Current native identity

- App name: `DeepStudy`
- Scheme: `deepstudy`
- iOS bundle ID: `com.deepstudy.student`
- Android application ID: `com.deepstudy.student`
- Orientation: portrait
- Appearance: system light/dark
- Tablet support: enabled on iOS

Confirm these identifiers before creating store records; changing them later
creates a different app identity.

## Implemented preparation

- secure native session storage;
- Magic Link exchange endpoint;
- iOS Associated Domains and Android intent filters;
- server-generated `apple-app-site-association` and `assetlinks.json`;
- branded icon, adaptive icon, splash, and web favicon assets;
- EAS development/preview/production profiles;
- account export/deletion, legal links, reminders, resource upload/sharing;
- bilingual core flows;
- no external Stripe digital-goods checkout inside the native client.

## Build validation

```powershell
npm install --prefix apps/mobile
npm run typecheck --prefix apps/mobile
npm run lint --prefix apps/mobile
npm test --prefix apps/mobile
npm run doctor --prefix apps/mobile

Set-Location apps/mobile
npx expo export --platform android --output-dir dist-android
npx expo export --platform ios --output-dir dist-ios
```

Exports validate Metro/platform bundling; they are not signed AAB/IPA files.

## Universal Links and App Links

Configure:

```dotenv
MOBILE_APP_LINK_BASE_URL=https://your-independent-domain.example
APPLE_TEAM_ID=XXXXXXXXXX
ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS=AA:BB:...
```

Then verify both well-known endpoints over HTTPS with no redirect and test a
Magic Link from real mail clients. Replace the provisional workers.dev host in
`app.json` when the final independent domain is selected.

## EAS/signing steps requiring account owners

1. Create/select the Expo organisation and run `eas init`.
2. Set the final project ID without changing bundle/application identity.
3. Add environment-specific public API URL values.
4. Connect Apple Developer and Google Play signing credentials.
5. Produce internal development builds.
6. Test on physical iOS and Android devices.
7. Configure store products if native digital access will be sold.
8. Produce signed production candidates.

No credentials, EAS project, signed build, TestFlight/Play track, or submission
is created here.

## Store metadata still required

- final support, marketing, privacy, terms, and account-deletion URLs;
- app description, keywords/categories, age/content rating;
- screenshots for required device classes and Android feature graphic;
- Apple privacy nutrition labels and Google Data safety declaration;
- review notes explaining Hint-first academic integrity;
- test/reviewer account or reliable Magic Link review procedure;
- export-compliance confirmation;
- customer support and refund process.

## Native purchase boundary

The app displays server entitlement and purchase history. It does not send a
student to an embedded web checkout for digital access. Before enabling native
purchase:

- create Apple/Google products matching server product keys;
- implement receipt/purchase-token verification on the server;
- make event processing idempotent;
- support restore purchases;
- map refunds/revocations to entitlement;
- keep server catalogue/display copy consistent;
- obtain current platform-policy review.

## Real-device acceptance

Test at minimum:

- sign-in link from Apple Mail, Gmail, and common Android mail clients;
- one-time link expiry/replay and multi-device sessions;
- 320–430 point phone widths plus tablet;
- VoiceOver/TalkBack and dynamic text;
- keyboard-safe tutor input;
- timer accuracy after background/lock;
- file picker/camera library permissions where used;
- offline/poor-network failure states;
- account deletion and sign-out;
- dark mode and reduced motion.

