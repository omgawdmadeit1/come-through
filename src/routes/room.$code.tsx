import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ComeThroughSession } from "@/components/comethrough/session";
import { normalizeRoomCode } from "@/lib/comethrough/types";
import { loadSavedName } from "@/lib/comethrough/storage";

const searchSchema = z.object({
  name: z.string().max(32).optional(),
});

export const Route = createFileRoute("/room/$code")({
  validateSearch: searchSchema,
  beforeLoad: ({ params, search }) => {
    const code = normalizeRoomCode(params.code);
    if (!code || code.length < 4) {
      throw redirect({ to: "/" });
    }
    if (code !== params.code) {
      throw redirect({
        to: "/room/$code",
        params: { code },
        search,
      });
    }
  },
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const { name: nameFromSearch } = Route.useSearch();
  const roomCode = normalizeRoomCode(code);
  const fromSearch = nameFromSearch?.trim().slice(0, 32) ?? "";
  // Shared links omit ?name=. Wait one tick for localStorage so we mount
  // P2P once — keying on displayName remounted the mesh with a new selfId
  // and left the first join (close() + leave) as a ghost peer.
  const [displayName, setDisplayName] = useState<string | null>(
    () => fromSearch || null,
  );

  useEffect(() => {
    if (fromSearch) {
      setDisplayName(fromSearch);
      return;
    }
    const saved = loadSavedName().trim().slice(0, 32);
    setDisplayName(saved || "Me");
  }, [fromSearch]);

  if (!displayName || !roomCode) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center text-sm text-[var(--color-fg-muted)]">
        Opening room…
      </main>
    );
  }

  return (
    <ComeThroughSession key={roomCode} code={roomCode} displayName={displayName} />
  );
}
