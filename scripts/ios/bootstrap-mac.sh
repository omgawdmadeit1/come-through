#!/usr/bin/env bash
# Run this on a Mac with Xcode + your Apple Developer account signed in.
# Builds the Come Through iOS project and opens it for Archive → TestFlight / App Store.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Come Through iOS bootstrap"
echo "    Bundle ID: app.comethrough.family"
echo "    Server:    https://come-through.vercel.app"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org then re-run."
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Xcode command-line tools / Xcode required."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm install
fi

echo "==> Ensuring Capacitor iOS platform"
if [[ ! -d ios/App ]]; then
  npx cap add ios
fi

echo "==> Sync Capacitor (config, plugins, web shell)"
npx cap sync ios

# Copy App Store icon set + privacy manifest into the Xcode project if present
ICON_SRC="$ROOT/ios-assets/AppIcon.appiconset"
ICON_DST="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [[ -d "$ICON_SRC" && -d "$ROOT/ios/App/App/Assets.xcassets" ]]; then
  echo "==> Installing AppIcon.appiconset"
  rm -rf "$ICON_DST"
  cp -R "$ICON_SRC" "$ICON_DST"
fi

PRIV_SRC="$ROOT/ios-assets/PrivacyInfo.xcprivacy"
PRIV_DST="$ROOT/ios/App/App/PrivacyInfo.xcprivacy"
if [[ -f "$PRIV_SRC" ]]; then
  echo "==> Installing PrivacyInfo.xcprivacy"
  cp "$PRIV_SRC" "$PRIV_DST"
fi

INFO_PLIST="$ROOT/ios/App/App/Info.plist"
if [[ -f "$INFO_PLIST" ]]; then
  echo "==> Ensuring microphone / speech usage descriptions"
  /usr/libexec/PlistBuddy -c "Set :NSMicrophoneUsageDescription Come Through needs the microphone so you can hold to talk and send a corrected cut-in message." "$INFO_PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :NSMicrophoneUsageDescription string Come Through needs the microphone so you can hold to talk and send a corrected cut-in message." "$INFO_PLIST"
  /usr/libexec/PlistBuddy -c "Set :NSSpeechRecognitionUsageDescription Come Through can turn your speech into editable text before you send." "$INFO_PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :NSSpeechRecognitionUsageDescription string Come Through can turn your speech into editable text before you send." "$INFO_PLIST"
  # Allow media capture in WKWebView
  /usr/libexec/PlistBuddy -c "Set :NSCameraUsageDescription Come Through does not use the camera; this key satisfies web media permission prompts." "$INFO_PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string Come Through does not use the camera; this key satisfies web media permission prompts." "$INFO_PLIST"
fi

echo
echo "==> Opening Xcode"
npx cap open ios

cat <<'NEXT'

Next in Xcode (signed into your Apple Developer account):
  1. Select the App target → Signing & Capabilities
  2. Team: your personal/company team
  3. Bundle Identifier: app.comethrough.family
     (If taken, change to e.g. com.YOURNAME.comethrough and match App Store Connect)
  4. Device: Any iOS Device (arm64)
  5. Product → Archive
  6. Distribute App → App Store Connect → Upload
  7. In App Store Connect, create the app, paste copy from appstore/metadata/en-US/,
     upload screenshots from appstore/screenshots/en-US/, set Privacy Policy URL,
     then submit for TestFlight and/or App Review.

Listing checklist: appstore/AppStore-checklist.md
NEXT
