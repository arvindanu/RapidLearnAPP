# RapidLearn

RapidLearn is a Next.js learning app with topic discovery, Wikipedia/NASA content, quizzes, speech-based Teach-Back analysis, and browser-local learning progress.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

Create `.env.local` for the server-side Gemini route:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Never commit `.env.local` or expose the Gemini key with a `NEXT_PUBLIC_` variable.

## Install RapidLearn as an Android PWA

The app includes a web manifest, install icons, and a service worker. Deploy it over HTTPS (the existing Vercel deployment is suitable), then on Android:

1. Open the deployed RapidLearn URL in **Chrome**.
2. Open Chrome's three-dot menu.
3. Choose **Install app** (or **Add to Home screen**, depending on Chrome version).
4. Launch RapidLearn from the Android launcher.

The service worker caches the app shell and hashed Next.js assets. Topic, quiz, and Gemini API requests remain online-only; cached screens do not make the external APIs available offline.

## Build a downloadable Android APK/AAB with GitHub Actions

The workflow at `.github/workflows/build-android.yml` builds a signed Android Trusted Web Activity (TWA) whenever you push to `main`/`master`, and can also be started manually from the GitHub **Actions** tab. A TWA opens the deployed PWA in Chrome's full-screen app surface, so the existing Next.js UI and browser speech-recognition support are retained instead of being recreated in a WebView.

### 1. Set the public Vercel URL as a GitHub repository variable

In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable**:

- Name: `RAPIDLEARN_URL`
- Value: your public HTTPS Vercel URL, for example `https://your-project.vercel.app` (use your actual deployed domain; do not include a trailing slash).

Optional variable:

- Name: `ANDROID_PACKAGE_ID`
- Value: `com.rapidlearn.app`

Choose the final package ID before publishing to Google Play. Changing it later creates a different Android application.

### 2. Create one permanent Android signing key on Windows

Install a JDK that includes `keytool` (JDK 17 is suitable). In PowerShell, run this once in a safe folder:

```powershell
keytool -genkeypair -v -keystore rapidlearn-release.keystore -alias rapidlearn -keyalg RSA -keysize 2048 -validity 10000
```

Choose strong passwords and keep a secure backup of `rapidlearn-release.keystore` and both passwords. **Do not commit the keystore to GitHub.** Losing this key can prevent you from updating an already distributed APK signed with it.

Convert the keystore to Base64 for the GitHub secret:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\rapidlearn-release.keystore")) | Set-Clipboard
```

### 3. Add GitHub repository secrets

Open **Settings → Secrets and variables → Actions → Secrets → New repository secret** and add:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The Base64 text copied in the previous step |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose |
| `ANDROID_KEY_PASSWORD` | The key password you chose (often the same) |
| `ANDROID_KEY_ALIAS` | `rapidlearn` |

These are signing credentials, not your Gemini key. Do not put them in source files.

### 4. Push the project to GitHub

Commit and push the updated project to the `main` or `master` branch. The workflow will:

- install Node, Java and Android build tools;
- run `npm ci` and `npm run build`;
- generate the TWA Android project using your Vercel URL;
- build a signed APK and an Android App Bundle (AAB);
- generate a Digital Asset Links file for your signing certificate;
- upload all three files as a GitHub Actions artifact.

To download the APK: open **Actions → Build RapidLearn Android app → latest successful run → Artifacts**. Download the `rapidlearn-android-*` artifact and install the APK on your Android device.

The workflow increments the Android version code on each run. Keep the same package ID and signing key for future updates.

### 5. Enable true full-screen TWA verification (important)

A TWA needs Digital Asset Links to prove that the Android app and website belong together. After the first successful GitHub build:

1. Download `assetlinks.json` from the workflow artifact.
2. Add it to this repository at `public/.well-known/assetlinks.json`.
3. Commit and push so Vercel deploys it.
4. Confirm that `https://YOUR-DEPLOYED-DOMAIN/.well-known/assetlinks.json` returns that JSON publicly.

Until this file is deployed, Android/Chrome may open the app in a browser Custom Tab with browser UI instead of the verified full-screen TWA. Keep the same signing key so the fingerprint continues to match. If you later use Google Play App Signing, add the Play app-signing certificate fingerprint as well.

## Notes

- The PWA and Android wrapper load the deployed Vercel site; this project does not bundle the Next.js server into the APK. Keep the Vercel deployment and its `GEMINI_API_KEY` / `GEMINI_MODEL` environment variables configured.
- Speech recognition depends on a supported Android browser and microphone permission. Use Chrome for installation and testing.
- Bookmarks and completed-topic progress remain in browser origin storage. They are not automatically synchronized between different browsers/devices.
- `public/sw.js` deliberately bypasses `/api/*` so old AI feedback, quizzes, or topic responses are never served from cache.
