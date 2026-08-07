import { listContent } from "@/lib/content";
import ContentList from "@/components/ContentList";

export const metadata = { title: "Wall of Shame" };

export default function WallOfShamePage() {
  const entries = listContent("wall-of-shame");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Wall of Shame
      </h1>
      <p className="text-league-ink/60 mb-8">
        Bad trades, worse drafts, and the managers who made them.
      </p>
      <ContentList type="wall-of-shame" entries={entries} />
    </div>
  );
}
