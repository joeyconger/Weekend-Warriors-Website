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
        weekly player projections. Early in the season, before there&apos;s much of a
        performance track record, these lean more heavily on projections; as real results
        pile up they shift toward actual performance.
      </p>
      <OddsDisclaimer />

      {!odds ? (
        <DataUnavailable what="odds" />
      ) : (
        <>
          {!odds.projectionsAvailable ? (
            <p className="text-xs text-league-ink/40 -mt-6 mb-8">
              Sleeper&apos;s projections were unreachable this refresh — everything below is
              running on season performance only, so it&apos;ll look flatter than usual until
              that comes back (or until more games are in the books).
            </p>
          ) : null}

          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Championship
          </h2>
          <div className="mb-12">
            <ChampionshipOddsBoard odds={odds.championship} />
          </div>

          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            {odds.weekNumber ? `Week ${odds.weekNumber} Lines` : "This Week's Lines"}
          </h2>
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
