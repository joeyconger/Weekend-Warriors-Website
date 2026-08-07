import { listContent } from "@/lib/content";
import ContentList from "@/components/ContentList";

export const metadata = { title: "Rivalries" };

export default function RivalriesPage() {
  const entries = listContent("rivalries");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Rivalries
      </h1>
      <p className="text-league-ink/60 mb-8">
        The beef between specific managers, curated by whoever&apos;s holding the grudge.
      </p>
      <ContentList type="rivalries" entries={entries} />
    </div>
  );
}
