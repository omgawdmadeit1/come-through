import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Come Through iOS shell.
 * Loads the live product so rooms, signaling, and cut-ins stay in sync with production.
 * Open ios/App/App.xcworkspace in Xcode on a Mac to archive for App Store / TestFlight.
 */
const config: CapacitorConfig = {
  appId: "app.comethrough.family",
  appName: "Come Through",
  webDir: "native-shell",
  backgroundColor: "#0a0a0b",
  server: {
    // Production app — keep in sync with the live Vercel deployment
    url: "https://come-through.vercel.app",
    cleartext: false,
    allowNavigation: ["come-through.vercel.app", "*.vercel.app"],
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Come Through",
    backgroundColor: "#0a0a0b",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0a0a0b",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0b",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
