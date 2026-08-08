import type { SeasonStanding, SeasonSummary } from "@/lib/sleeper/history";

export interface WorstRecordEntry {
  season: string;
  team: SeasonStanding;
}

/**
 * The worst-record team for every season the league has played on
 * Sleeper. Fewest wins loses; ties broken by lowest points scored (a
 * team that went 4-10 but put up big numbers isn't as "worst" as one
 * that went 4-10 while also scoring nothing).
 */
export function worstRecordPerSeason(seasons: SeasonSummary[]): WorstRecordEntry[] {
  return seasons
    .filter((s) => s.standings.length > 0)
    .map((s) => {
      const worst = [...s.standings].sort(
        (a, b) => a.wins - b.wins || a.pointsFor - b.pointsFor
      )[0];
      return { season: s.season, team: worst };
    });
}
