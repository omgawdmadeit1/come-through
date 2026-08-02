/** Browser speech helpers — recognition, recording, TTS — tuned for iOS Safari. */

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

export function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function pickVoice(lang = "en-US"): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith(lang) && /samantha|karen|moira|daniel|alex/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith(lang) && v.localService) ??
    voices.find((v) => v.lang.startsWith(lang)) ??
    voices[0] ??
    null;
  return preferred;
}

export function speakText(
  text: string,
  opts?: { rate?: number; pitch?: number; lang?: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ttsSupported() || !text.trim()) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.lang = opts?.lang ?? "en-US";
    u.rate = opts?.rate ?? 1;
    u.pitch = opts?.pitch ?? 1;
    const voice = pickVoice(u.lang);
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => reject(new Error("speech synthesis failed"));
    // iOS sometimes needs a tiny delay after user gesture / unlock
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function playAudioBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  try {
    const audio = new Audio(url);
    audio.setAttribute("playsinline", "true");
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio play failed"));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function preferredRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

export type RecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<{ blob: Blob; mime: string; durationMs: number }>;
  cancel: () => void;
  stream: MediaStream | null;
};

export function createRecorder(): RecorderHandle {
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: BlobPart[] = [];
  let startedAt = 0;
  let mime = preferredRecorderMime() ?? "";

  return {
    get stream() {
      return stream;
    },
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      chunks = [];
      mime = preferredRecorderMime() ?? "";
      mediaRecorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mime = mediaRecorder.mimeType || mime || "audio/webm";
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      startedAt = performance.now();
      mediaRecorder.start(100);
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
          reject(new Error("not recording"));
          return;
        }
        const rec = mediaRecorder;
        rec.onstop = () => {
          const durationMs = Math.round(performance.now() - startedAt);
          const blob = new Blob(chunks, { type: mime });
          stream?.getTracks().forEach((t) => t.stop());
          stream = null;
          mediaRecorder = null;
          resolve({ blob, mime, durationMs });
        };
        rec.onerror = () => reject(new Error("recorder error"));
        if (rec.state !== "inactive") rec.stop();
        else {
          stream?.getTracks().forEach((t) => t.stop());
          stream = null;
          mediaRecorder = null;
          resolve({ blob: new Blob([], { type: mime }), mime, durationMs: 0 });
        }
      });
    },
    cancel() {
      try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
      } catch {
        /* ignore */
      }
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
      chunks = [];
    },
  };
}

/** Soft chime for priority cut-in without competing with speech. */
export function playPriorityChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    gain.connect(ctx.destination);

    for (const [i, freq] of [660, 880].entries()) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.08);
      osc.stop(now + 0.32 + i * 0.05);
    }
    void ctx.resume();
    setTimeout(() => void ctx.close(), 600);
  } catch {
    /* audio optional */
  }
}

export async function unlockAudio(): Promise<void> {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    if (ttsSupported()) {
      // Warm voices list on iOS
      window.speechSynthesis.getVoices();
      const noop = new SpeechSynthesisUtterance(" ");
      noop.volume = 0;
      window.speechSynthesis.speak(noop);
      window.speechSynthesis.cancel();
    }
    setTimeout(() => void ctx.close(), 200);
  } catch {
    /* best-effort */
  }
}
