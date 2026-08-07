import { listContent } from "@/lib/content";
import ContentList from "@/components/ContentList";

export const metadata = { title: "Recaps" };

export default function RecapsPage() {
  const entries = listContent("recaps");
  const analysis = entries.filter((e) => e.frontmatter.category === "analysis");
  const recaps = entries.filter((e) => e.frontmatter.category !== "analysis");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Recaps
      </h1>
      <p className="text-league-ink/60 mb-8">
        Weekly recaps and deeper analysis pieces, written by a human.
      </p>

      {entries.length === 0 ? (
        <ContentList type="recaps" entries={entries} />
      ) : (
        <div className="space-y-12">
          {analysis.length > 0 && (
            <section>
              <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
                Analysis
              </h2>
              <ContentList type="recaps" entries={analysis} />
            </section>
          )}
          {recaps.length > 0 && (
            <section>
              <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
                Weekly Recaps
              </h2>
              <ContentList type="recaps" entries={recaps} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
