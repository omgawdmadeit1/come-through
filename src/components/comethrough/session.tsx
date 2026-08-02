import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Headphones,
  Link2,
  Mic,
  MicOff,
  Radio,
  Send,
  Share2,
  Type,
  Volume2,
  X,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useP2PRoom } from "@/lib/multiplayer";
import {
  base64ToBlob,
  blobToBase64,
  createRecorder,
  playAudioBlob,
  playPriorityChime,
  speechRecognitionSupported,
  speakText,
  stopSpeaking,
  unlockAudio,
  getSpeechRecognitionCtor,
  type SpeechRecognitionLike,
} from "@/lib/comethrough/speech";
import {
  isWireMsg,
  roomIdFromCode,
  type DeliveryMode,
  type DraftMessage,
  type ThreadItem,
  type WireMsg,
} from "@/lib/comethrough/types";
import { cn } from "@/lib/utils";

const MAX_RECORD_MS = 12_000;
const MAX_AUDIO_BYTES = 180_000;

type Phase = "idle" | "holding" | "review" | "sending";

export function ComeThroughSession({
  code,
  displayName,
}: {
  code: string;
  displayName: string;
}) {
  const room = roomIdFromCode(code);
  const p2p = useP2PRoom({ room, name: displayName });

  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState<DraftMessage | null>(null);
  const [mode, setMode] = useState<DeliveryMode>("corrected");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [incoming, setIncoming] = useState<ThreadItem | null>(null);
  const [holdMs, setHoldMs] = useState(0);
  const [micReady, setMicReady] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [interim, setInterim] = useState("");
  const [liveText, setLiveText] = useState("");

  const recorderRef = useRef(createRecorder());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartedRef = useRef(0);
  const finalsRef = useRef("");
  const playQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pointerActiveRef = useRef(false);

  const connectedPeer = useMemo(
    () => p2p.peers.find((p) => p.connectionState === "connected") ?? null,
    [p2p.peers],
  );
  const peerCount = p2p.peers.length;
  const linkReady = Boolean(connectedPeer);

  const clearHoldTimers = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    holdTimerRef.current = null;
    maxTimerRef.current = null;
  };

  const stopRecognition = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }
  };

  const startRecognition = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    stopRecognition();
    finalsRef.current = "";
    setLiveText("");
    setInterim("");
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      let interimBits = "";
      let finalBits = finalsRef.current;
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const row = ev.results[i];
        if (!row) continue;
        const t = row[0]?.transcript ?? "";
        if (row.isFinal) finalBits = `${finalBits} ${t}`.trim();
        else interimBits += t;
      }
      finalsRef.current = finalBits;
      setLiveText(finalBits);
      setInterim(interimBits.trim());
    };
    rec.onerror = () => {
      /* user can still type / send voice */
    };
    rec.onend = () => {
      /* keep closed until next hold */
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      /* already started */
    }
  };

  const ensureAudio = useCallback(async () => {
    if (audioUnlocked) return;
    await unlockAudio();
    setAudioUnlocked(true);
  }, [audioUnlocked]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
      return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
    }
  }, []);

  useEffect(() => {
    return p2p.onMessage((from, data, channel) => {
      if (channel !== "reliable") return;
      if (!isWireMsg(data)) return;
      if (data.type === "presence") return;
      if (data.type === "ack") {
        setThread((prev) =>
          prev.map((item) =>
            item.id === data.id && item.direction === "out"
              ? { ...item, status: "delivered" }
              : item,
          ),
        );
        return;
      }
      if (data.type === "cutin") {
        const item: ThreadItem = {
          id: data.id,
          direction: "in",
          fromName: data.fromName || p2p.peers.find((p) => p.id === from)?.name || "Someone",
          text: data.text,
          mode: data.mode,
          ts: data.ts,
          status: "playing",
          hasAudio: Boolean(data.audioBase64),
        };
        setThread((prev) => {
          if (prev.some((x) => x.id === item.id)) return prev;
          return [item, ...prev].slice(0, 40);
        });
        setIncoming(item);

        const ack: WireMsg = { v: 1, type: "ack", id: data.id, fromName: displayName };
        p2p.send(ack, from);

        playQueueRef.current = playQueueRef.current
          .then(async () => {
            playPriorityChime();
            if (data.mode === "voice" || data.mode === "both") {
              if (data.audioBase64 && data.audioMime) {
                try {
                  await playAudioBlob(base64ToBlob(data.audioBase64, data.audioMime));
                } catch {
                  /* fall through to TTS */
                }
              }
            }
            if (
              (data.mode === "corrected" || data.mode === "both" || !data.audioBase64) &&
              data.text.trim()
            ) {
              try {
                await speakText(data.text);
              } catch {
                /* ignore */
              }
            }
          })
          .catch(() => {})
          .finally(() => {
            setThread((prev) =>
              prev.map((x) => (x.id === item.id ? { ...x, status: "played" } : x)),
            );
            setIncoming((cur) => (cur?.id === item.id ? null : cur));
          });
      }
    });
  }, [p2p, displayName]);

  useEffect(() => {
    if (!p2p.joined) return;
    const presence: WireMsg = { v: 1, type: "presence", name: displayName };
    p2p.send(presence);
  }, [p2p.joined, p2p.send, displayName, peerCount]);

  const beginHold = async () => {
    if (phase === "review" || phase === "sending" || phase === "holding") return;
    if (pointerActiveRef.current) return;
    pointerActiveRef.current = true;
    try {
      await ensureAudio();
      await recorderRef.current.start();
      setMicReady(true);
      setPhase("holding");
      holdStartedRef.current = performance.now();
      setHoldMs(0);
      setInterim("");
      setLiveText("");
      finalsRef.current = "";
      if (mode !== "voice") startRecognition();
      clearHoldTimers();
      holdTimerRef.current = setInterval(() => {
        setHoldMs(Math.round(performance.now() - holdStartedRef.current));
      }, 50);
      maxTimerRef.current = setTimeout(() => {
        void endHold();
      }, MAX_RECORD_MS);
    } catch {
      pointerActiveRef.current = false;
      setMicReady(false);
      toast.error("Microphone permission is required to cut in.");
      setPhase("idle");
    }
  };

  const endHold = async () => {
    if (!pointerActiveRef.current && phase !== "holding") return;
    pointerActiveRef.current = false;
    clearHoldTimers();
    stopRecognition();
    if (phase !== "holding") {
      setPhase("idle");
      return;
    }
    try {
      const { blob, mime, durationMs } = await recorderRef.current.stop();
      const transcript = `${finalsRef.current} ${interim}`.replace(/\s+/g, " ").trim();
      let audioBase64: string | undefined;
      let audioMime: string | undefined;
      if (blob.size > 0 && blob.size <= MAX_AUDIO_BYTES && durationMs >= 250) {
        audioBase64 = await blobToBase64(blob);
        audioMime = mime;
      } else if (blob.size > MAX_AUDIO_BYTES) {
        toast.message("Voice clip trimmed — sending corrected speech instead.");
      }
      if (!transcript && !audioBase64) {
        toast.message("Hold a little longer, or type a message.");
        setPhase("idle");
        setHoldMs(0);
        return;
      }
      const nextMode: DeliveryMode =
        mode === "voice" && !audioBase64
          ? "corrected"
          : mode === "corrected" && !transcript
            ? "voice"
            : mode;
      setDraft({
        text: transcript,
        audioBase64,
        audioMime,
        mode: nextMode,
        durationMs,
      });
      setPhase("review");
    } catch {
      toast.error("Could not capture that take. Try again.");
      setPhase("idle");
    } finally {
      setHoldMs(0);
      setInterim("");
    }
  };

  const cancelDraft = () => {
    stopSpeaking();
    setDraft(null);
    setPhase("idle");
  };

  const sendDraft = async () => {
    if (!draft) return;
    if (!linkReady) {
      toast.error("Wait until the other phone shows connected.");
      return;
    }
    const text = draft.text.trim();
    if (!text && !draft.audioBase64) {
      toast.error("Add a corrected message or record voice.");
      return;
    }
    setPhase("sending");
    const id = `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const payload: WireMsg = {
      v: 1,
      type: "cutin",
      id,
      fromName: displayName,
      text: text || "(voice message)",
      mode: draft.mode,
      audioBase64: draft.mode === "corrected" ? undefined : draft.audioBase64,
      audioMime: draft.mode === "corrected" ? undefined : draft.audioMime,
      ts: Date.now(),
    };
    const item: ThreadItem = {
      id,
      direction: "out",
      fromName: displayName,
      text: payload.text,
      mode: payload.mode,
      ts: payload.ts,
      status: "sending",
      hasAudio: Boolean(payload.audioBase64),
    };
    setThread((prev) => [item, ...prev].slice(0, 40));
    try {
      p2p.send(payload);
      setThread((prev) => prev.map((x) => (x.id === id ? { ...x, status: "sent" } : x)));
      setDraft(null);
      setPhase("idle");
      toast.success("Cut in sent");
    } catch {
      setThread((prev) => prev.map((x) => (x.id === id ? { ...x, status: "failed" } : x)));
      setPhase("review");
      toast.error("Send failed — stay on this screen and try again.");
    }
  };

  const sendTypedOnly = async () => {
    if (phase === "review" && draft) {
      await sendDraft();
      return;
    }
    setDraft({
      text: "",
      mode: "corrected",
      durationMs: 0,
    });
    setPhase("review");
  };

  const copyLink = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Room link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.message(`Share this code: ${code}`);
    }
  };

  const shareRoom = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Come Through",
          text: `Join my Come Through room ${code} so I can cut in with clear speech.`,
          url,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  };

  const dismissIncoming = () => {
    stopSpeaking();
    setIncoming(null);
  };

  const statusLabel = !p2p.joined
    ? "Connecting…"
    : linkReady
      ? `Live with ${connectedPeer?.name || "partner"}`
      : peerCount > 0
        ? "Linking phones…"
        : "Waiting for the other phone";

  const statusVariant = linkReady ? "live" : peerCount > 0 ? "accent" : "default";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pad">
      <header className="flex items-start justify-between gap-3 pb-4">
        <div className="min-w-0">
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <ArrowLeft className="size-4" />
            Leave
          </Link>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
            Come Through · Room {code}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            {displayName}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusVariant}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                linkReady ? "bg-[var(--color-live)]" : "bg-[var(--color-fg-subtle)]",
              )}
            />
            {statusLabel}
          </Badge>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => void shareRoom()} aria-label="Share room">
              <Share2 className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => void copyLink()} aria-label="Copy link">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>
      </header>

      {!audioUnlocked && (
        <button
          type="button"
          onClick={() => void ensureAudio()}
          className="mb-4 flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-bg-elevated))] px-4 py-3 text-left transition-opacity hover:opacity-95"
        >
          <Volume2 className="size-5 shrink-0 text-[var(--color-accent)]" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[var(--color-fg)]">
              Tap once to allow priority playback
            </span>
            <span className="mt-0.5 block text-xs text-[var(--color-fg-muted)]">
              Required on iPhone so cut-ins can speak into their headphones.
            </span>
          </span>
        </button>
      )}

      <section className="mb-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] text-[var(--color-accent)]">
            <Headphones className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-fg)]">Priority cut-in</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              Hold the button, speak, fix the words, then send. Their phone plays your corrected
              speech over whatever they were doing — no call to answer.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              ["corrected", "Corrected"],
              ["both", "Both"],
              ["voice", "My voice"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "h-11 rounded-[var(--radius-md)] border text-sm font-medium transition-colors",
                mode === value
                  ? "border-[color-mix(in_oklab,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg-muted)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
          {mode === "corrected" && "Plays clear text-to-speech on their phone."}
          {mode === "voice" && "Plays your recorded voice (short clips)."}
          {mode === "both" && "Plays your voice, then the corrected wording."}
        </p>
      </section>

      <section className="mb-4 min-h-0 flex-1 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-fg)]">Thread</p>
          <p className="text-xs text-[var(--color-fg-subtle)] tabular-nums">
            {thread.length} message{thread.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="max-h-52 space-y-2 overflow-y-auto p-3 sm:max-h-64">
          {thread.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <Radio className="size-6 text-[var(--color-fg-subtle)]" />
              <p className="text-sm text-[var(--color-fg-muted)]">
                Nothing yet. When someone cuts in, it appears here and plays automatically.
              </p>
            </div>
          ) : (
            thread.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-[var(--radius-lg)] border px-3 py-2.5",
                  item.direction === "out"
                    ? "ml-6 border-[color-mix(in_oklab,var(--color-accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)]"
                    : "mr-6 border-[var(--color-border)] bg-[var(--color-bg-subtle)]",
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-[var(--color-fg-muted)]">
                    {item.direction === "out" ? "You" : item.fromName}
                  </p>
                  <p className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
                    {item.status}
                    {item.hasAudio ? " · voice" : ""}
                  </p>
                </div>
                <p className="text-sm leading-snug text-[var(--color-fg)]">{item.text}</p>
              </article>
            ))
          )}
        </div>
      </section>

      {phase === "review" && draft ? (
        <section className="mb-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 animate-cutin">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-fg)]">Correct before sending</p>
            <button
              type="button"
              onClick={cancelDraft}
              className="rounded-full p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
              aria-label="Discard"
            >
              <X className="size-4" />
            </button>
          </div>
          <Textarea
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Type or fix what you said…"
            autoFocus
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
            {draft.audioBase64 ? (
              <span className="inline-flex items-center gap-1">
                <Volume2 className="size-3.5" />
                Voice attached · {(draft.durationMs / 1000).toFixed(1)}s
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Type className="size-3.5" />
                Text only
              </span>
            )}
            {!speechRecognitionSupported() && (
              <span>Live dictation unavailable on this browser — type to correct.</span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={cancelDraft}>
              Discard
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => void sendDraft()}
              disabled={!linkReady}
            >
              <Send className="size-4" />
              Cut in
            </Button>
          </div>
        </section>
      ) : (
        <section className="mt-auto flex flex-col items-center pb-2 pt-2">
          <div className="relative mb-4 flex h-44 w-44 items-center justify-center">
            {phase === "holding" && (
              <>
                <span className="absolute inset-0 rounded-full border border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] animate-pulse-ring" />
                <span className="absolute inset-3 rounded-full border border-[color-mix(in_oklab,var(--color-accent)_25%,transparent)] animate-pulse-ring [animation-delay:200ms]" />
              </>
            )}
            <button
              type="button"
              aria-label={phase === "holding" ? "Release to review" : "Hold to talk"}
              className={cn(
                "relative z-10 flex h-36 w-36 touch-none select-none flex-col items-center justify-center rounded-full border text-center transition-[transform,background-color,border-color,box-shadow] duration-150",
                phase === "holding"
                  ? "scale-[0.98] border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_18%,var(--color-bg-elevated))] shadow-[var(--shadow-ptt)]"
                  : "border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-soft)] active:scale-[0.98]",
                !linkReady && phase !== "holding" && "opacity-90",
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                void beginHold();
              }}
              onPointerUp={() => void endHold()}
              onPointerCancel={() => void endHold()}
              onPointerLeave={() => {
                if (pointerActiveRef.current) void endHold();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {phase === "holding" ? (
                <>
                  <Mic className="mb-2 size-8 text-[var(--color-accent)]" />
                  <span className="text-sm font-semibold text-[var(--color-fg)]">Listening</span>
                  <span className="mt-1 font-mono text-xs tabular-nums text-[var(--color-fg-muted)]">
                    {(holdMs / 1000).toFixed(1)}s
                  </span>
                  <div className="mt-3 flex h-5 items-end gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="wave-bar w-1 rounded-full bg-[var(--color-accent)]"
                        style={{
                          height: `${10 + (i % 3) * 6}px`,
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {micReady ? (
                    <Mic className="mb-2 size-8 text-[var(--color-fg)]" />
                  ) : (
                    <MicOff className="mb-2 size-8 text-[var(--color-fg-muted)]" />
                  )}
                  <span className="text-sm font-semibold text-[var(--color-fg)]">Hold to talk</span>
                  <span className="mt-1 px-4 text-xs text-[var(--color-fg-muted)]">
                    Release to correct & send
                  </span>
                </>
              )}
            </button>
          </div>

          {(liveText || interim) && phase === "holding" && (
            <p className="mb-3 max-w-sm px-4 text-center text-sm text-[var(--color-fg-muted)]">
              <span className="text-[var(--color-fg)]">{liveText}</span>
              {interim ? <span className="opacity-60"> {interim}</span> : null}
            </p>
          )}

          <div className="flex w-full gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => void sendTypedOnly()}>
              <Type className="size-4" />
              Type instead
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => void ensureAudio()}>
              <Link2 className="size-4" />
              {audioUnlocked ? "Audio ready" : "Enable audio"}
            </Button>
          </div>
          {!linkReady && (
            <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-[var(--color-fg-subtle)]">
              Open this room on the other iPhone with code{" "}
              <span className="font-mono text-[var(--color-fg-muted)]">{code}</span>. Keep both
              screens open while linking.
            </p>
          )}
        </section>
      )}

      {incoming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-bg)_72%,transparent)] p-4 backdrop-blur-sm sm:items-center"
          role="alertdialog"
          aria-label="Incoming cut-in"
        >
          <div className="w-full max-w-md animate-cutin rounded-[var(--radius-2xl)] border border-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge variant="live">
                <Radio className="size-3" />
                Cutting in
              </Badge>
              <button
                type="button"
                onClick={dismissIncoming}
                className="rounded-full p-1.5 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)]"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-fg-subtle)]">
              {incoming.fromName}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug tracking-tight text-[var(--color-fg)] text-balance">
              {incoming.text}
            </p>
            <p className="mt-4 text-sm text-[var(--color-fg-muted)]">
              Playing at priority level. Hold the button below to reply without starting a call.
            </p>
            <Button variant="accent" className="mt-5 w-full" onClick={dismissIncoming}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
