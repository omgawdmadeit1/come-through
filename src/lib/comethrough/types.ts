export type DeliveryMode = "corrected" | "voice" | "both";

export type WireMsg =
  | {
      v: 1;
      type: "cutin";
      id: string;
      fromName: string;
      text: string;
      mode: DeliveryMode;
      audioBase64?: string;
      audioMime?: string;
      ts: number;
    }
  | {
      v: 1;
      type: "ack";
      id: string;
      fromName: string;
    }
  | {
      v: 1;
      type: "presence";
      name: string;
    };

export interface ThreadItem {
  id: string;
  direction: "out" | "in";
  fromName: string;
  text: string;
  mode: DeliveryMode;
  ts: number;
  status: "sending" | "sent" | "delivered" | "failed" | "playing" | "played";
  hasAudio: boolean;
}

export interface DraftMessage {
  text: string;
  audioBase64?: string;
  audioMime?: string;
  mode: DeliveryMode;
  durationMs: number;
}

export function isWireMsg(data: unknown): data is WireMsg {
  if (!data || typeof data !== "object") return false;
  const m = data as { v?: unknown; type?: unknown };
  return m.v === 1 && typeof m.type === "string";
}

export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i += 1) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export function roomIdFromCode(code: string): string {
  return `ct-${code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;
}

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
