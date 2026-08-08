import { buildOddsData } from "@/lib/odds-data";
import OddsDisclaimer from "@/components/OddsDisclaimer";
import ChampionshipOddsBoard from "@/components/ChampionshipOddsBoard";
import MatchupLineCard from "@/components/MatchupLineCard";
import WinTotalsTable from "@/components/WinTotalsTable";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Odds" };

export default async function OddsPage() {
  const odds = await buildOddsData().catch(() => null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Odds
      </h1>
      <p className="text-league-ink/60 mb-4">
        Championship futures, this week&apos;s lines, and season win totals — blended from
        season performance, real strength of schedule, and (when available) Sleeper&apos;s
        weekly player projections.
      </p>
      <OddsDisclaimer />

      {!odds ? (
        <DataUnavailable what="odds" />
      ) : (
        <>
          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Championship
          </h2>
          <div className="mb-12">
            <ChampionshipOddsBoard odds={odds.championship} />
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display uppercase tracking-wide text-league-primary text-lg">
              {odds.weekNumber ? `Week ${odds.weekNumber} Lines` : "This Week's Lines"}
            </h2>
            {!odds.projectionsAvailable && odds.matchupLines.length > 0 ? (
              <span className="text-xs text-league-ink/40">
                Running on season performance only — projections unavailable
              </span>
            ) : null}
          </div>
          {odds.matchupLines.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 mb-12">
              {odds.matchupLines.map((line) => (
                <MatchupLineCard key={`${line.teamA.userId}-${line.teamB.userId}`} line={line} />
              ))}
            </div>
          ) : (
            <div className="mb-12">
              <DataUnavailable what="this week's lines" />
            </div>
          )}

          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Season Win Totals
          </h2>
          <WinTotalsTable totals={odds.winTotals} />
        </>
      )}
    </div>
  );
}
