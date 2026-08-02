const NAME_KEY = "comethrough:name";
const LAST_ROOM_KEY = "comethrough:last-room";

export function loadSavedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 32));
  } catch {
    /* ignore */
  }
}

export function loadLastRoom(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LAST_ROOM_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveLastRoom(code: string) {
  try {
    localStorage.setItem(LAST_ROOM_KEY, code);
  } catch {
    /* ignore */
  }
}
