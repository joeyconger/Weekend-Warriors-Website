import type { LeagueHistory } from "@/lib/sleeper/history";

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 text-league-accent"
      aria-hidden="true"
    >
      <path
        d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 12v4M9 20h6M10 16h4l1 4H9l1-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChampionsBanner({ history }: { history: LeagueHistory }) {
  const champions = history.seasons
    .filter((s) => s.champion)
    .map((s) => ({ season: s.season, champion: s.champion! }));

  if (champions.length === 0) {
    return null;
  }

  return (
    <section className="bg-league-primary-light border-t border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-white text-lg uppercase tracking-[0.2em] mb-5 text-center">
          Past Champions
        </h2>
        <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
          {champions.map(({ season, champion }) => (
            <div key={season} className="flex-shrink-0 w-40">
              {/* Retired-jersey-banner treatment: hangs from a top rail. */}
              <div className="h-3 w-px bg-white/30 mx-auto" />
              <div className="rounded-b-sm rounded-t-md bg-league-primary border border-league-accent/40 shadow-lg px-3 py-4 text-center">
                <div className="flex justify-center mb-2">
                  <TrophyIcon />
                </div>
                <p className="font-display text-league-accent text-2xl font-semibold leading-none">
                  {season}
                </p>
                <p className="mt-2 text-white text-sm font-medium truncate" title={champion.teamName}>
                  {champion.teamName}
                </p>
                <p className="text-white/60 text-xs truncate" title={champion.displayName}>
                  {champion.displayName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
