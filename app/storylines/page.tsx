import { listStorylines } from "@/lib/storylines/db";
import StorylineCard from "@/components/StorylineCard";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Storylines
      </h1>
      <p className="text-league-ink/60 mb-8 max-w-2xl">
        AI-generated recaps of trades, blowouts, streaks, and waiver-wire steals — written
        weekly from the league&apos;s actual Sleeper activity, cached rather than regenerated
        on every visit.
      </p>

      {storylines.length === 0 ? (
        <p className="text-league-ink/50">
          No storylines yet — these are generated on a schedule (see{" "}
          <code>npm run generate-storylines</code>) once the season has some activity to
          write about.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((s) => (
              <StorylineCard key={s.id} storyline={s} />
            ))}
          </div>

          {archive.length > 0 && (
            <>
              <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mt-12 mb-4">
                Archive
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archive.map((s) => (
                  <StorylineCard key={s.id} storyline={s} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
