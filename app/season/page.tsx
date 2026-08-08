import { getLeagueHistory } from "@/lib/sleeper/history";
import { getCurrentWeek, getWeekMatchups } from "@/lib/sleeper/current-week";
import { siteConfig } from "@/lib/site-config";
import StandingsTable from "@/components/StandingsTable";
import MatchupCard from "@/components/MatchupCard";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Season" };

export default async function SeasonPage() {
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  const currentSeason = history?.seasons[0] ?? null;

  let week: number | null = null;
  let matchups: Awaited<ReturnType<typeof getWeekMatchups>> = [];
  try {
    week = await getCurrentWeek();
    matchups = await getWeekMatchups(siteConfig.sleeperLeagueId, week);
  } catch {
    week = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        {currentSeason?.season ?? "Current"} Season
      </h1>
      <p className="text-league-ink/60 mb-8">
        Live standings and matchups from Sleeper. Past seasons live under History.
      </p>

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        {week ? `Week ${week} Matchups` : "Matchups"}
      </h2>
      {matchups.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 mb-12">
          {matchups.map((m) => (
            <MatchupCard key={m.matchupId} matchup={m} />
          ))}
        </div>
      ) : (
        <div className="mb-12">
          <DataUnavailable what="this week's matchups" />
        </div>
      )}

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        Standings
      </h2>
      {currentSeason ? (
        <StandingsTable standings={currentSeason.standings} />
      ) : (
        <DataUnavailable what="standings" />
      )}
    </div>
  );
}
