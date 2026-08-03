import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Come Through" },
      {
        name: "description",
        content:
          "How Come Through handles microphone audio, speech, room codes, and peer connections.",
      },
    ],
  }),
});

function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">Last updated: August 2, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">What Come Through is</h2>
          <p>
            Come Through lets family members create a private room, hold to talk, correct their
            words, and send a priority message that plays on another phone. It is designed for
            short, intentional cut-ins — not continuous call recording.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Microphone & speech</h2>
          <p>
            When you hold to talk, the app uses the device microphone to capture your message and
            may use on-device / browser speech recognition to draft editable text. Audio is used
            only to create the message you choose to send. We do not sell audio, build advertising
            profiles from your voice, or use your speech to train third-party AI models.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Rooms & peer connections</h2>
          <p>
            Room codes connect devices for a session. After a short signaling handshake, messages
            are delivered peer-to-peer when possible. Room membership is ephemeral for the session;
            share codes only with people you trust.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Data we store</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Display name and last room code on your device (local storage only).</li>
            <li>Short-lived connection metadata needed to join a room.</li>
            <li>No account password, contact book, or photo library access.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Children</h2>
          <p>
            Come Through is intended for family use with a parent or guardian involved. If you are a
            parent using the app with a child, you control the room code and when messages are sent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Your choices</h2>
          <p>
            You can deny microphone permission in iOS Settings, leave a room at any time, or stop
            using the app. Clearing the app’s storage removes the saved name and last room code on
            that device.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[var(--color-fg)]">Contact</h2>
          <p>
            Questions about privacy:{" "}
            <a
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
              href="mailto:privacy@comethrough.app"
            >
              privacy@comethrough.app
            </a>{" "}
            or open Support in the app.
          </p>
        </section>
      </div>
    </div>
  );
}
