import { createFileRoute } from "@tanstack/react-router";
import { ComeThroughHome } from "@/components/comethrough/home";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <ComeThroughHome />;
}
