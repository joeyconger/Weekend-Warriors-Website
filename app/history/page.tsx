import { getLeagueHistory } from "@/lib/sleeper/history";
import { siteConfig } from "@/lib/site-config";
import { manualRecords } from "@/lib/manual-records";
import StandingsTable from "@/components/StandingsTable";
import RecordCard from "@/components/RecordCard";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "History" };

export default async function HistoryPage() {
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  // seasons[0] is always the current season (most-recent-first) — everything
  // else is a past season. This year's standings live under the Season tab.
  const pastSeasons = history ? history.seasons.slice(1) : [];
  const r = history?.records;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        History
      </h1>
      <p className="text-league-ink/60 mb-8 max-w-2xl">
        Every all-time record the league has on the books, plus standings for every season
        before this one. This year&apos;s standings live under the Season tab.
      </p>

      <h2 className="font-display uppercase tracking-wide text-league-primary text-xl mb-4">
        All-Time Records
      </h2>

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
        <div className="mb-16">
          <h3 className="font-display uppercase tracking-wide text-league-primary text-sm mb-4">
            Hand-Kept Records
          </h3>
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
        </div>
      )}

      <h2 className="font-display uppercase tracking-wide text-league-primary text-xl mb-4">
        Past Seasons
      </h2>
      {!history ? (
        <DataUnavailable what="past standings" />
      ) : pastSeasons.length === 0 ? (
        <p className="text-league-ink/50 text-sm">
          No past seasons yet — this is the league&apos;s first year on Sleeper.
        </p>
      ) : (
        <div className="space-y-12">
          {pastSeasons.map((season) => (
            <section key={season.leagueId}>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-display uppercase tracking-wide text-league-primary text-lg">
                  {season.season}
                </h3>
                {season.champion ? (
                  <span className="text-sm text-league-accent-dark font-medium">
                    Champion: {season.champion.teamName}
                  </span>
                ) : null}
              </div>
              <StandingsTable standings={season.standings} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
