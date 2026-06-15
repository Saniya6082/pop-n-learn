import { createFileRoute } from "@tanstack/react-router";
import BalloonGameApp from "@/game/BalloonGameApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Balloon Pop — Learn & Play" },
      { name: "description", content: "Educational balloon popping game: pop the right letter, word, number, or math answer." },
      { property: "og:title", content: "Balloon Pop — Learn & Play" },
      { property: "og:description", content: "Educational balloon popping game with levels, lives, combos and confetti." },
    ],
  }),
  component: Index,
});

function Index() {
  return <BalloonGameApp />;
}
