# Mobile Build and Release

The native client lives in `apps/mobile` and targets iOS and Android from one
strict-TypeScript Expo/React Native codebase. It calls the same Worker API and
is not a WebView.

The code is prepared for builds and internal testing. It is not connected to a
confirmed EAS project, signed for either store, submitted, or published.

## Local setup

```powershell
npm install --prefix apps/mobile
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run start --prefix apps/mobile
```

Example for an Android emulator:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

A physical device needs a LAN URL or an HTTPS preview origin. Never place
server keys in `EXPO_PUBLIC_` values.

For the Windows-to-iPhone local launcher, Safari home-screen mode, and signed
development-build steps, see
[IPHONE_LOCAL_TESTING.md](./IPHONE_LOCAL_TESTING.md).

## Implemented native surfaces

- passwordless Magic Link sign-in and secure session storage;
- bilingual onboarding for an arbitrary institution/semester/course;
- Today, focus timer, queue, plan, courses, assessments, timetable, and topics;
- private Hint-first practice, error evidence, mastery, and due retests;
- AI tutor and private resources, including ICS/files, Photos timetable
  screenshots, and pasted timetable text;
- notifications, weekly report, billing overview, settings, export, deletion;
- deep links, legal links, light/dark appearance, and touch-sized controls.

The billing screen intentionally does not launch Stripe Checkout for native
digital goods. It reads the server entitlement and explains that store product
configuration is required.

## Validation

```powershell
npm run typecheck --prefix apps/mobile
npm run lint --prefix apps/mobile
npm test --prefix apps/mobile
npm run doctor --prefix apps/mobile

Set-Location apps/mobile
npx expo export --platform android --output-dir dist-android
npx expo export --platform ios --output-dir dist-ios
```

Expo export proves platform bundling; it does not produce a signed AAB/IPA.

## EAS profiles

`eas.json` includes:

- `development`: development client/internal distribution;
- `preview`: internal distribution;
- `production`: auto-incremented production version.

Before the first EAS build, the account owner must:

1. create/select the Expo organisation;
2. run `eas init`;
3. confirm `com.deepstudy.student` for both platforms;
4. configure environment-specific API URLs;
5. connect Apple/Google signing;
6. add final support/legal URLs and metadata;
7. test development builds on real devices.

## Deep links

Development may use `deepstudy://auth/callback`. Release builds should use the
verified HTTPS domain configured in `app.json` and backend environment.

Server endpoints:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

They remain empty/fail-closed until `APPLE_TEAM_ID` and valid SHA-256
fingerprints are supplied.

## Release checklist

Apple:

- Developer Program, App Store Connect record, certificate/profile;
- privacy nutrition labels, age rating, export compliance;
- support/privacy/terms/account-deletion URLs;
- TestFlight real-device and reviewer-flow validation.

Android:

- Play Console, Play App Signing, final application ID;
- Data safety/content rating/account-deletion URL;
- adaptive icon, feature graphic/screenshots;
- internal/closed track and staged rollout tests.

Both:

- current platform-policy review for digital products;
- native purchase verification/restore/refund adapter if enabled;
- VoiceOver/TalkBack, dynamic type, background timer, poor-network testing;
- Magic Links from common email clients;
- backward-compatible Worker and rollback owner.

## Rollback

Keep the prior native build compatible with the current Worker. Stop a staged
rollout or promote the last known-good build while leaving compatible APIs
available. Use forward database repairs rather than destructive reversal.
