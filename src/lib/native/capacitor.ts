/** Lightweight Capacitor bridge — safe no-ops in plain Safari / desktop. */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function cap(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor ?? null;
}

export function isNativeApp(): boolean {
  try {
    return Boolean(cap()?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function nativePlatform(): "ios" | "android" | "web" {
  try {
    const p = cap()?.getPlatform?.();
    if (p === "ios" || p === "android") return p;
  } catch {
    /* ignore */
  }
  return "web";
}

export async function prepareNativeChrome() {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0a0a0b" });
  } catch {
    /* plugin optional in web */
  }
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* optional */
  }
}

export async function hapticLight() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* optional */
  }
}

export async function hapticMedium() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* optional */
  }
}
