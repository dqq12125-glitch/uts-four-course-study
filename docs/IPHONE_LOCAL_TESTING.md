# Use DeepStudy on an iPhone Before Store Publication

There are two supported pre-store paths.

## Immediate path: Safari home-screen app

This path needs no Apple Developer account.

1. Connect the Windows computer and iPhone to the same private Wi-Fi network.
2. From the repository root run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/start-iphone.ps1 -Mode web
   ```

3. Open the displayed LAN URL in iPhone Safari.
4. Sign up. In local development, use the displayed direct development sign-in
   action instead of waiting for real email.
5. In Safari choose **Share → Add to Home Screen**.

The script enables only local-development mock storage, mock AI, and full
feature access. Production ignores `DEVELOPMENT_FULL_ACCESS`.

The computer and script must remain running. The local mock file store is
in-memory, so source files do not survive a backend restart; confirmed
timetable rows remain in local D1.

## Native path: signed development build

DeepStudy targets Expo SDK 57. The current App Store Expo Go build supports a
different SDK version, so Expo Go is not the reliable path for this project.
A DeepStudy development build is the correct native test client.

On Windows, an installable iPhone build requires:

- an Expo account;
- an active Apple Developer Program membership;
- the iPhone registered for ad-hoc provisioning.

From `apps/mobile`:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

Install the resulting build from the EAS link, enable iOS Developer Mode when
prompted, then run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-iphone.ps1 -Mode native
```

The development build connects to Metro over the same Wi-Fi network. It
supports the native file picker, Photos timetable-screenshot picker, secure
session storage, and the complete timetable confirmation flow.

## Persistent remote testing

For use away from the development computer, deploy a preview backend with:

- preview D1 migrations through `0007`;
- private R2;
- a verified email sender;
- HTTPS `APP_BASE_URL`;
- a configured AI extraction provider if screenshot OCR is needed;
- production-safe feature flags and secrets.

Then build the native preview profile with
`EXPO_PUBLIC_API_BASE_URL` set to that preview HTTPS origin. This is internal
testing, not App Store publication.
