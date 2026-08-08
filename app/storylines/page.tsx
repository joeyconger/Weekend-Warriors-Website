import { listStorylines } from "@/lib/storylines/db";
import { listContent } from "@/lib/content";
import StorylineCard from "@/components/StorylineCard";
import ContentList from "@/components/ContentList";

export const metadata = { title: "Storylines" };
export const dynamic = "force-dynamic";

export default function StorylinesPage() {
  let storylines: ReturnType<typeof listStorylines> = [];
  try {
    storylines = listStorylines(50);
  } catch {
    storylines = [];
  }

  const [recent, archive] = [storylines.slice(0, 9), storylines.slice(9)];

  const recapEntries = listContent("recaps");
  const analysis = recapEntries.filter((e) => e.frontmatter.category === "analysis");
  const recaps = recapEntries.filter((e) => e.frontmatter.category !== "analysis");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Storylines
      </h1>
      <p className="text-league-ink/60 mb-8 max-w-2xl">
        AI-generated recaps of trades, blowouts, streaks, and waiver-wire steals, written
        weekly from the league&apos;s actual Sleeper activity — plus weekly recaps and
        analysis pieces written by a human.
      </p>

      {storylines.length === 0 ? (
        <p className="text-league-ink/50 mb-12">
          No AI storylines yet — these are generated on a schedule (see{" "}
          <code>npm run generate-storylines</code>) once the season has some activity to
          write about.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {recent.map((s) => (
              <StorylineCard key={s.id} storyline={s} />
            ))}
          </div>

          {archive.length > 0 && (
            <>
              <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
                Archive
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                {archive.map((s) => (
                  <StorylineCard key={s.id} storyline={s} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {analysis.length > 0 && (
        <>
          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Analysis
          </h2>
          <div className="mb-12">
            <ContentList type="recaps" entries={analysis} />
          </div>
        </>
      )}

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        Weekly Recaps
      </h2>
      <ContentList type="recaps" entries={recaps} />
    </div>
  );
}
