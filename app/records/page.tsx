import { getLeagueHistory } from "@/lib/sleeper/history";
import { siteConfig } from "@/lib/site-config";
import { manualRecords } from "@/lib/manual-records";
import RecordCard from "@/components/RecordCard";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Records" };

export default async function RecordsPage() {
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  const r = history?.records;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Records
      </h1>
      <p className="text-league-ink/60 mb-8 max-w-2xl">
        Everything tagged &ldquo;via Sleeper&rdquo; is computed automatically by walking every
        season and week the league has played on Sleeper. Anything from before that (or
        anything too subjective for an API) lives below it.
      </p>

      {!history ? (
        <DataUnavailable what="league history" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {r?.mostPointsGame && (
            <RecordCard
              title="Most Points, Single Game"
              value={r.mostPointsGame.points.toFixed(2)}
              holder={r.mostPointsGame.manager.teamName}
              note={`Week ${r.mostPointsGame.week}, ${r.mostPointsGame.season}`}
            />
          )}
          {r?.fewestPointsGame && (
            <RecordCard
              title="Fewest Points, Single Game"
              value={r.fewestPointsGame.points.toFixed(2)}
              holder={r.fewestPointsGame.manager.teamName}
              note={`Week ${r.fewestPointsGame.week}, ${r.fewestPointsGame.season}`}
            />
          )}
          {r?.biggestBlowout && (
            <RecordCard
              title="Biggest Blowout"
              value={`+${r.biggestBlowout.margin.toFixed(2)}`}
              holder={`${r.biggestBlowout.winner.teamName} over ${r.biggestBlowout.loser.teamName}`}
              note={`Week ${r.biggestBlowout.week}, ${r.biggestBlowout.season} (${r.biggestBlowout.winnerPoints.toFixed(1)}–${r.biggestBlowout.loserPoints.toFixed(1)})`}
            />
          )}
          {r?.closestMatchup && (
            <RecordCard
              title="Closest Matchup"
              value={r.closestMatchup.margin.toFixed(2)}
              holder={`${r.closestMatchup.winner.teamName} over ${r.closestMatchup.loser.teamName}`}
              note={`Week ${r.closestMatchup.week}, ${r.closestMatchup.season} (${r.closestMatchup.winnerPoints.toFixed(1)}–${r.closestMatchup.loserPoints.toFixed(1)})`}
            />
          )}
          {r?.mostPointsSeason && (
            <RecordCard
              title="Most Points, Season"
              value={r.mostPointsSeason.points.toFixed(2)}
              holder={r.mostPointsSeason.manager.teamName}
              note={r.mostPointsSeason.season}
            />
          )}
          {r?.longestWinStreak && (
            <RecordCard
              title="Longest Win Streak"
              value={`${r.longestWinStreak.length} games`}
              holder={r.longestWinStreak.manager.teamName}
              note={`${r.longestWinStreak.startSeason} Wk ${r.longestWinStreak.startWeek} – ${r.longestWinStreak.endSeason} Wk ${r.longestWinStreak.endWeek}`}
            />
          )}
          {r?.longestLossStreak && (
            <RecordCard
              title="Longest Losing Streak"
              value={`${r.longestLossStreak.length} games`}
              holder={r.longestLossStreak.manager.teamName}
              note={`${r.longestLossStreak.startSeason} Wk ${r.longestLossStreak.startWeek} – ${r.longestLossStreak.endSeason} Wk ${r.longestLossStreak.endWeek}`}
            />
          )}
        </div>
      )}

      {manualRecords.length > 0 && (
        <>
          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Hand-Kept Records
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manualRecords.map((rec) => (
              <RecordCard
                key={rec.title}
                title={rec.title}
                value={rec.value}
                holder={rec.holder}
                note={rec.note}
                auto={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
