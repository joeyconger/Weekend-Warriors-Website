import { getLeagueHistory } from "@/lib/sleeper/history";
import { siteConfig } from "@/lib/site-config";
import StandingsTable from "@/components/StandingsTable";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Standings" };

export default async function StandingsPage() {
  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Standings
      </h1>
      <p className="text-league-ink/60 mb-8">Current season, and every season before it.</p>

      {!history || history.seasons.length === 0 ? (
        <DataUnavailable what="standings history" />
      ) : (
        <div className="space-y-12">
          {history.seasons.map((season) => (
            <section key={season.leagueId}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display uppercase tracking-wide text-league-primary text-lg">
                  {season.season}
                </h2>
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
