import { listContent } from "@/lib/content";
import ContentList from "@/components/ContentList";

export const metadata = { title: "Recaps" };

export default function RecapsPage() {
  const entries = listContent("recaps");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Recaps
      </h1>
      <p className="text-league-ink/60 mb-8">Weekly and season recaps, written by a human.</p>
      <ContentList type="recaps" entries={entries} />
    </div>
  );
}
