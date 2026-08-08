import { listContent } from "@/lib/content";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { worstRecordPerSeason } from "@/lib/wall-of-shame";
import { siteConfig } from "@/lib/site-config";
import ContentList from "@/components/ContentList";
import WorstRecordTable from "@/components/WorstRecordTable";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Wall of Shame" };

export default async function WallOfShamePage() {
  const entries = listContent("wall-of-shame");
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  // Current season only counts once it actually has a champion — a "worst
  // record" mid-season is just noise that'll change by the time it matters.
  const currentSeasonDone = history?.seasons[0]?.champion != null;
  const eligibleSeasons = history
    ? currentSeasonDone
      ? history.seasons
      : history.seasons.slice(1)
    : [];
  const worstRecords = worstRecordPerSeason(eligibleSeasons);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Wall of Shame
      </h1>
      <p className="text-league-ink/60 mb-8">
        Bad trades, worse drafts, and the managers who made them.
      </p>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display uppercase tracking-wide text-league-primary text-lg">
          Worst Record, Every Year
        </h2>
        <span className="text-[10px] uppercase tracking-wide text-league-ink/40">via Sleeper</span>
      </div>
      {!history ? (
        <div className="mb-12">
          <DataUnavailable what="season history" />
        </div>
      ) : worstRecords.length === 0 ? (
        <p className="text-league-ink/50 text-sm mb-12">
          {currentSeasonDone
            ? "No completed seasons yet."
            : "This season isn't over yet — check back once it's crowned a champion."}
        </p>
      ) : (
        <div className="mb-12">
          <WorstRecordTable entries={worstRecords} />
        </div>
      )}

      {entries.length > 0 ? (
        <>
          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Entries
          </h2>
          <ContentList type="wall-of-shame" entries={entries} />
        </>
      ) : null}
    </div>
  );
}
