# Come Through — App Store build (your Apple Developer account)

You already have a working web app at **https://come-through.vercel.app**.  
This repo also contains a **native iOS shell** (Capacitor) so you can ship **Come Through** on the App Store / TestFlight with your Apple Developer membership.

## What’s already prepared

| Item | Location |
| --- | --- |
| iOS Xcode project | `ios/` (bundle id `app.comethrough.family`) |
| Capacitor config | `capacitor.config.ts` → loads production URL |
| Mic / speech privacy strings | `ios/App/App/Info.plist` |
| Privacy Nutrition file | `ios/App/App/PrivacyInfo.xcprivacy` |
| App icons | `ios/App/App/Assets.xcassets/AppIcon.appiconset` |
| Store listing copy | `appstore/metadata/en-US/` |
| Screenshots | `appstore/screenshots/en-US/` |
| Icon 1024 | `appstore/icon-1024.png` |
| Privacy Policy (live) | https://come-through.vercel.app/privacy |
| Support (live) | https://come-through.vercel.app/support |
| One-command Mac setup | `scripts/ios/bootstrap-mac.sh` |

> App Store **signing and upload must be done on a Mac** with Xcode, signed into **your** Apple Developer account. That cannot be completed from this cloud builder.

## On your Mac (about 15–25 minutes)

### 1. Get the project
```bash
git clone https://github.com/omgawdmadeit1/come-through.git
cd come-through
```

### 2. Bootstrap & open Xcode
```bash
bash scripts/ios/bootstrap-mac.sh
```
This installs deps (if needed), syncs Capacitor, installs icons/permissions, and opens Xcode.

### 3. Sign with your team
In Xcode → **App** target → **Signing & Capabilities**:
1. Check **Automatically manage signing**
2. **Team:** your Apple Developer team
3. Confirm **Bundle Identifier:** `app.comethrough.family`  
   - If Apple says it’s taken, change to e.g. `com.YOURNAME.comethrough` and use the same id in App Store Connect

### 4. Archive & upload
1. Destination: **Any iOS Device (arm64)**
2. **Product → Archive**
3. **Distribute App → App Store Connect → Upload**

### 5. App Store Connect listing
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps → +**
2. Name: **Come Through**
3. Bundle ID: match Xcode
4. Paste copy from `appstore/metadata/en-US/`
5. Upload screenshots from `appstore/screenshots/en-US/`
6. Privacy Policy URL: `https://come-through.vercel.app/privacy`
7. Support URL: `https://come-through.vercel.app/support`
8. Fill **App Privacy** labels using `appstore/AppStore-checklist.md`
9. Submit for **TestFlight** first, then App Review

## Review notes (paste into App Store Connect)

```
Come Through is a private two-device utility for family cut-ins.

Demo:
1. Install on two iPhones (or device + second phone).
2. Phone A: enter name → Create room → copy code.
3. Phone B: enter name → paste code → Join.
4. Hold Talk on A, release, optionally edit text, Send.
5. Phone B plays the priority message.

No login. No purchases. Microphone is requested when starting talk.
Privacy: https://come-through.vercel.app/privacy
```

## After you ship
- TestFlight with both iPhones (16 Pro Max + 14 Pro Max)
- Keep the room open on both devices when testing cut-ins
- Web + App Store builds share the same production backend

Questions or a blocked signing step: say what Xcode shows and we can adjust the project.
