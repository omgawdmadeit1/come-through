# Come Through — TestFlight / App Store (Windows + GitHub)

You ship from **Windows**. I prepare the iOS project here; **GitHub Actions (macOS runners)** does the Xcode archive and TestFlight upload. No Mac on your desk required for the build.

**Live web app:** https://come-through.vercel.app  
**Repo:** https://github.com/omgawdmadeit1/come-through  
**Bundle ID:** `app.comethrough.family`

---

## One-time setup (about 10 minutes, Windows browser)

### 1. App Store Connect API key
1. Open [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. **Generate** a key with **App Manager** (or Admin)
3. Download the `.p8` once (Apple only shows it once)
4. Copy:
   - **Key ID**
   - **Issuer ID**
   - Full `.p8` text (including `BEGIN PRIVATE KEY` / `END PRIVATE KEY`)

### 2. Team ID
Apple Developer → [Membership details](https://developer.apple.com/account#MembershipDetailsCard) → **Team ID** (10 characters)

### 3. Create the app record (if missing)
App Store Connect → **My Apps → +**  
- Name: **Come Through**  
- Bundle ID: **app.comethrough.family** (register in Certificates, Identifiers & Profiles if needed)  
- SKU: `come-through`  
- Privacy Policy: https://come-through.vercel.app/privacy  

### 4. Add GitHub secrets (repo settings)
https://github.com/omgawdmadeit1/come-through/settings/secrets/actions

| Secret | Value |
| --- | --- |
| `APPLE_TEAM_ID` | 10-char Team ID |
| `APPLE_API_KEY_ID` | Key ID |
| `APPLE_API_ISSUER_ID` | Issuer UUID |
| `APPLE_API_KEY_P8` | Entire `.p8` file contents |

---

## Ship a TestFlight build (Windows)

1. Open **Actions** → **iOS TestFlight**  
   https://github.com/omgawdmadeit1/come-through/actions/workflows/ios-testflight.yml  
2. **Run workflow** → type a short changelog → Run  
3. Wait ~15–25 minutes (macOS runner + archive + upload)  
4. On your iPhones: **TestFlight** app → install **Come Through**

Or from a tag:
```text
git tag ios-v1.0.1
git push origin ios-v1.0.1
```

---

## What the workflow does
1. `npm ci` + Capacitor iOS sync  
2. Injects Team ID + mic/speech privacy strings  
3. Fastlane archives with App Store Connect API signing  
4. Uploads IPA to TestFlight  
5. Saves IPA as a GitHub Actions artifact  

Files:
- `.github/workflows/ios-testflight.yml`
- `fastlane/Fastfile`
- `ios/` (Xcode project)
- Store listing copy: `appstore/metadata/en-US/`

---

## After TestFlight is green → App Review
1. Fill listing from `appstore/metadata/en-US/`  
2. Screenshots: `appstore/screenshots/en-US/`  
3. Support: https://come-through.vercel.app/support  
4. Privacy: https://come-through.vercel.app/privacy  
5. Submit the same build for App Review  

Review notes:
```
Come Through is a private two-device utility for family cut-ins.
1. Two iPhones in TestFlight
2. Phone A: name → Create room → code
3. Phone B: name → Join
4. Hold Talk → edit → Send → priority play on B
No login. No purchases. Mic used only when holding Talk.
```

---

## Optional: local Mac
`bash scripts/ios/bootstrap-mac.sh` if you ever want Xcode on a Mac. Not required for TestFlight when secrets are set.

## If a build fails
- Open the failed Actions run → share the red error lines  
- Common: missing secrets, bundle ID not registered, API key role too low, first-time agreement not accepted in App Store Connect  
