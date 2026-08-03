# Come Through — App Store submission checklist

## Bundle
- **Name:** Come Through
- **Bundle ID:** `app.comethrough.family`
- **Category:** Social Networking (secondary: Utilities)
- **Age rating:** 4+ (no unrestricted web browsing UI; communication utility)
- **Price:** Free

## Required URLs (already live)
- Privacy: https://come-through.vercel.app/privacy
- Support: https://come-through.vercel.app/support
- Marketing: https://come-through.vercel.app

## App Privacy labels (App Store Connect)
Declare as applicable:
- **Audio Data** — used for App Functionality; not linked to identity; not used for tracking
- **User Content** (message text you type/edit) — App Functionality; not linked to identity; not used for tracking
- Do **not** claim tracking / third-party advertising

## Device capabilities
- Microphone (required for hold-to-talk)
- Speech recognition (optional; improves draft text on supported devices)
- Network (rooms + peer delivery)

## Review notes (paste into App Store Connect)
```
Come Through is a private two-device utility for family cut-ins.

Demo:
1. Install on two iPhones (or one device + Simulator with a second physical device).
2. On phone A: enter name → Create room → copy code.
3. On phone B: enter name → paste code → Join.
4. Hold Talk on A, release, optionally edit text, Send.
5. Phone B plays the priority message.

No login. No purchases. Microphone permission is requested when starting talk.
Privacy Policy: https://come-through.vercel.app/privacy
```

## Assets in this repo
- Icon 1024: `appstore/icon-1024.png`
- Screenshots: `appstore/screenshots/en-US/`
- Listing copy: `appstore/metadata/en-US/`
- Capacitor config: `capacitor.config.ts`
- Mac bootstrap: `scripts/ios/bootstrap-mac.sh`
