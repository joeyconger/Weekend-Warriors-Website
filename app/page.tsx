import { getLeague } from "@/lib/sleeper/client";
import { getCurrentDraft, draftSummaryLabel } from "@/lib/sleeper/draft";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { SleeperApiError } from "@/lib/sleeper/client";
import { siteConfig } from "@/lib/site-config";
import ChampionsBanner from "@/components/ChampionsBanner";
import AtAGlance from "@/components/AtAGlance";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;

export default async function HomePage() {
  let league;
  let draftLabel = "Not yet scheduled";
  let historyError = false;
  let history = null;

  try {
    league = await getLeague(siteConfig.sleeperLeagueId);
    const draft = await getCurrentDraft(siteConfig.sleeperLeagueId).catch(() => null);
    draftLabel = draftSummaryLabel(draft);
  } catch (err) {
    league = null;
    if (!(err instanceof SleeperApiError)) throw err;
  }

  try {
    history = await getLeagueHistory(siteConfig.sleeperLeagueId);
  } catch {
    historyError = true;
  }

  return (
    <div>
      <section className="relative bg-league-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <p className="uppercase tracking-[0.3em] text-league-accent text-sm mb-4">
            Welcome to
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-tight text-balance">
            {siteConfig.leagueName}
          </h1>
          {siteConfig.tagline ? (
            <p className="mt-4 text-white/70 text-lg max-w-2xl mx-auto text-balance">
              {siteConfig.tagline}
            </p>
          ) : null}
        </div>
      </section>

      {history && !historyError ? (
        <ChampionsBanner history={history} />
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="font-display uppercase tracking-wide text-league-primary text-xl mb-4">
            The League
          </h2>
          <p className="text-league-ink/80 leading-relaxed">
            {siteConfig.leagueName} has been fought over since {siteConfig.foundedYear}.
            Standings, rosters, and records below update automatically from Sleeper —
            the rest of this site is where the trash talk lives.
          </p>
        </div>
        {league ? (
          <AtAGlance league={league} draftLabel={draftLabel} />
        ) : (
          <DataUnavailable what="league settings" />
        )}
      </section>
    </div>
  );
}
