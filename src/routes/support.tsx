import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Headphones, Mic, Radio, Share2 } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — Come Through" },
      {
        name: "description",
        content: "Help for Come Through rooms, hold-to-talk, and iPhone setup.",
      },
    ],
  }),
});

function SupportPage() {
  const steps = [
    {
      icon: Radio,
      title: "Create or join a room",
      body: "One person creates a room and shares the code or link. The other joins with the same code.",
    },
    {
      icon: Mic,
      title: "Hold to talk, then correct",
      body: "Press and hold the talk control, release, edit the draft if needed, then send the cut-in.",
    },
    {
      icon: Headphones,
      title: "Keep the room open",
      body: "Both phones should keep Come Through open (or recently active) so priority playback can land.",
    },
    {
      icon: Share2,
      title: "Add to Home Screen (optional)",
      body: "In Safari: Share → Add to Home Screen. Or install the App Store build when available.",
    },
  ];

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg safe-pad px-4 pb-12 pt-4">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)]"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Come Through
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em]">
        Support
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        Quick help for private rooms and priority cut-ins on iPhone.
      </p>

      <div className="mt-8 space-y-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]">
              <Icon className="size-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-fg)]">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        <p className="font-medium text-[var(--color-fg)]">Microphone permission</p>
        <p className="mt-2">
          If hold-to-talk fails, open iOS Settings → Come Through → enable Microphone (and Speech
          Recognition if shown). Then reopen the room and try again.
        </p>
      </section>

      <section className="mt-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        <p className="font-medium text-[var(--color-fg)]">Contact</p>
        <p className="mt-2">
          Email{" "}
          <a
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            href="mailto:support@comethrough.app"
          >
            support@comethrough.app
          </a>
          . Include your iPhone model and whether you created or joined the room.
        </p>
        <p className="mt-3">
          <Link
            to="/privacy"
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </section>
    </div>
  );
}
