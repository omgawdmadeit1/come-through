import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Headphones, MessageSquareText, Radio, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { makeRoomCode, normalizeRoomCode } from "@/lib/comethrough/types";
import { loadLastRoom, loadSavedName, saveLastRoom, saveName } from "@/lib/comethrough/storage";

export function ComeThroughHome() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const canStart = name.trim().length >= 1;

  useEffect(() => {
    setName(loadSavedName() || "");
    setJoinCode(loadLastRoom() || "");
  }, []);

  const go = (code: string) => {
    const clean = normalizeRoomCode(code);
    if (!clean || clean.length < 4) return;
    const display = name.trim().slice(0, 32) || "Me";
    saveName(display);
    saveLastRoom(clean);
    void navigate({
      to: "/room/$code",
      params: { code: clean },
      search: { name: display },
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pad">
      <header className="pt-4 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg-muted)]">
          <Radio className="size-3.5 text-[var(--color-accent)]" />
          Come Through
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[2.15rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-fg)] text-balance">
          Cut in without interrupting their world.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-fg-muted)]">
          Hold to talk, fix what you said, then send. Their iPhone plays your clear message over
          headphones — no phone call, no app switch fight.
        </p>
      </header>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <label className="block text-sm font-medium text-[var(--color-fg)]" htmlFor="display-name">
          Your name
        </label>
        <Input
          id="display-name"
          className="mt-2"
          placeholder="Dad, Mom, Coach…"
          value={name}
          maxLength={32}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mt-5 grid gap-3">
          <Button
            variant="accent"
            size="lg"
            className="w-full justify-between"
            disabled={!canStart}
            onClick={() => go(makeRoomCode())}
          >
            <span className="inline-flex items-center gap-2">
              <Headphones className="size-4" />
              Create room
            </span>
            <ArrowRight className="size-4" />
          </Button>

          <div className="relative py-1 text-center text-xs uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            or join
          </div>

          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
              placeholder="Room code"
              className="font-mono uppercase tracking-[0.2em]"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button
              variant="default"
              size="lg"
              disabled={!canStart || normalizeRoomCode(joinCode).length < 4}
              onClick={() => go(joinCode)}
            >
              Join
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {[
          {
            icon: MessageSquareText,
            title: "Correct before it lands",
            body: "Speech becomes editable text. Fix names, tone, or typos — then send clear wording.",
          },
          {
            icon: Headphones,
            title: "Plays into their flow",
            body: "Priority overlay + spoken playback. They stay in what they were doing; your message cuts through.",
          },
          {
            icon: Shield,
            title: "Private room codes",
            body: "Direct phone-to-phone link after a short handshake. Share only with people you trust.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] text-[var(--color-fg)]">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-fg)]">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-8 pb-2 text-center text-xs leading-relaxed text-[var(--color-fg-subtle)]">
        Add Come Through to your Home Screen for the fastest cut-ins.
        <br />
        Works best when both iPhones keep the room open.
      </footer>
    </div>
  );
}
