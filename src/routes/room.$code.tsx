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
  const [displayName, setDisplayName] = useState(
    () => (nameFromSearch && nameFromSearch.trim()) || "Me",
  );

  useEffect(() => {
    if (nameFromSearch && nameFromSearch.trim()) {
      setDisplayName(nameFromSearch.trim().slice(0, 32));
      return;
    }
    const saved = loadSavedName();
    if (saved) setDisplayName(saved.slice(0, 32));
  }, [nameFromSearch]);

  return (
    <ComeThroughSession
      key={`${code}:${displayName}`}
      code={normalizeRoomCode(code)}
      displayName={displayName.slice(0, 32)}
    />
  );
}
