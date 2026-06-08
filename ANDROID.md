# Running Lands on Android

The web client is wrapped in a native Android shell using [Capacitor](https://capacitorjs.com),
producing an installable APK. Single-player and AI games (including the new
Worldroot master AI) run **entirely on-device** — the `GameEngine` and AI execute
in the WebView, no network connection required. Multiplayer connects out to a
hosted dedicated server (see `DEPLOY.md`).

---

## Getting the APK (recommended: GitHub Actions)

Building an Android app requires the Android SDK and Google's Maven repository,
which most sandboxed/local dev setups can't reach. The easiest path is to let
GitHub Actions build it for you on a hosted runner that has everything
preinstalled.

1. Push/merge your changes to the `android` branch (or any branch — you can also
   trigger the workflow manually on any branch from the Actions tab).
2. Go to the repo's **Actions** tab → **Android Build** workflow.
3. Click **Run workflow**, choose `debug` (fast, installable immediately) or
   `release` (unsigned — needs to be signed before the Play Store will accept it,
   but installs fine via sideloading either way).
4. When the run finishes, open it and download the `lands-android-debug` (or
   `-release`) artifact — it's a zip containing the `.apk`.

### Installing the APK on your phone

1. Transfer the `.apk` to your device (email it to yourself, use a cloud drive,
   USB cable, etc).
2. On the phone, enable **Install unknown apps** for whichever app you'll open
   the file with (Settings → Apps → Special access → Install unknown apps —
   exact path varies by Android version/manufacturer).
3. Open the `.apk` from your file manager / downloads and tap **Install**.

---

## Connecting to a multiplayer server

By default the app falls back to `http://localhost:3001`, which doesn't exist on
a phone — so out of the box, **multiplayer won't connect** but **single-player
and AI games work perfectly offline**.

To bake in a real server URL so multiplayer works:

1. Deploy a dedicated server (see `DEPLOY.md` for Render/Railway instructions).
2. Set the `DEDICATED_SERVER_URL` repository variable
   (Settings → Secrets and variables → Actions → Variables) to your server's
   HTTPS URL, e.g. `https://lands-server.onrender.com`.
3. Re-run the **Android Build** workflow — it bakes the URL into `client/.env.local`
   before building, so the resulting APK connects to your server automatically.

> The Capacitor config uses `androidScheme: 'https'` and `allowMixedContent: false`,
> so your dedicated server **must** be served over HTTPS (Render/Railway both give
> you this for free).

---

## Building locally (if you have the Android SDK / Android Studio)

If your machine already has Android Studio + SDK set up and can reach
`dl.google.com`, you can build directly:

```
cd client
npm install
npm run android:build      # builds the web client, syncs Capacitor, assembles a debug APK
```

The resulting APK lands at `client/android/app/build/outputs/apk/debug/app-debug.apk`.

Other useful scripts (run from `client/`):

| Script              | What it does                                              |
|---------------------|-----------------------------------------------------------|
| `npm run cap:sync`  | Build the web client and copy it into the native project  |
| `npm run android:build` | `cap:sync` + assemble a debug APK via Gradle           |
| `npm run android:open`  | Opens the native project in Android Studio             |

---

## Project layout

| Path                          | Purpose                                              |
|-------------------------------|------------------------------------------------------|
| `client/capacitor.config.ts`  | App identity (`com.lands.game` / "Lands"), web dir, Android scheme settings |
| `client/android/`             | Generated native Android Gradle project (commit this — it contains app icons, manifest, gradle config; build output is gitignored) |
| `.github/workflows/android-build.yml` | CI workflow that builds and uploads the APK |

The app ID is `com.lands.game` and the display name is "Lands". Both can be
changed in `capacitor.config.ts` and `client/android/app/src/main/res/values/strings.xml`
— but if you change the app ID after the first build, run `npx cap sync android`
again to regenerate the native project files.
