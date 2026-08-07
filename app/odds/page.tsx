import { getLeague } from "@/lib/sleeper/client";
import { regularSeasonWeeks } from "@/lib/sleeper/league-info";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { getCurrentWeek, getWeekMatchups } from "@/lib/sleeper/current-week";
import { siteConfig } from "@/lib/site-config";
import {
  buildChampionshipOdds,
  buildMatchupLine,
  buildWinTotals,
  computeTeamPower,
} from "@/lib/odds";
import OddsDisclaimer from "@/components/OddsDisclaimer";
import ChampionshipOddsBoard from "@/components/ChampionshipOddsBoard";
import MatchupLineCard from "@/components/MatchupLineCard";
import WinTotalsTable from "@/components/WinTotalsTable";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Odds" };

export default async function OddsPage() {
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  const currentSeason = history?.seasons[0] ?? null;
  const league = await getLeague(siteConfig.sleeperLeagueId).catch(() => null);

  let week: number | null = null;
  let matchups: Awaited<ReturnType<typeof getWeekMatchups>> = [];
  try {
    week = await getCurrentWeek();
    matchups = await getWeekMatchups(siteConfig.sleeperLeagueId, week);
  } catch {
    week = null;
  }

  const teams = currentSeason ? computeTeamPower(currentSeason.standings) : [];
  const teamByUserId = new Map(teams.map((t) => [t.identity.userId, t]));
  const weeks = league ? regularSeasonWeeks(league) : 14;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Odds
      </h1>
      <p className="text-league-ink/60 mb-4">
        Championship futures, this week&apos;s lines, and season win totals — derived from
        actual scoring, updated as the season goes.
      </p>
      <OddsDisclaimer />

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        Championship
      </h2>
      {teams.length > 0 ? (
        <div className="mb-12">
          <ChampionshipOddsBoard odds={buildChampionshipOdds(teams)} />
        </div>
      ) : (
        <div className="mb-12">
          <DataUnavailable what="championship odds" />
        </div>
      )}

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        {week ? `Week ${week} Lines` : "This Week's Lines"}
      </h2>
      {matchups.length > 0 && teams.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 mb-12">
          {matchups.map((m) => {
            const [a, b] = m.teams;
            const powerA = a ? teamByUserId.get(a.identity.userId) : undefined;
            const powerB = b ? teamByUserId.get(b.identity.userId) : undefined;
            if (!powerA || !powerB) return null;
            return <MatchupLineCard key={m.matchupId} line={buildMatchupLine(powerA, powerB)} />;
          })}
        </div>
      ) : (
        <div className="mb-12">
          <DataUnavailable what="this week's lines" />
        </div>
      )}

      <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
        Season Win Totals
      </h2>
      {teams.length > 0 ? (
        <WinTotalsTable totals={buildWinTotals(teams, weeks)} />
      ) : (
        <DataUnavailable what="season win totals" />
      )}
    </div>
  );
}
