import { getMatchups } from "./client";

export interface ScheduledMatchup {
  week: number;
  matchupId: number;
  rosterIds: number[];
}

/**
 * Full regular-season schedule (every week's roster pairings), including
 * weeks that haven't been played yet — Sleeper generates the whole
 * schedule up front once the league is set up, so future weeks' matchups
 * are visible in advance (just with points: 0 until they're played).
 */
export async function getFullSchedule(
  leagueId: string,
  totalWeeks: number
): Promise<ScheduledMatchup[]> {
  const perWeek = await Promise.all(
    Array.from({ length: totalWeeks }, (_, i) => i + 1).map(async (week) => {
      const matchups = await getMatchups(leagueId, week).catch(() => []);
      const byMatchupId = new Map<number, number[]>();
      for (const m of matchups) {
        if (m.matchup_id == null) continue;
        const list = byMatchupId.get(m.matchup_id) ?? [];
        list.push(m.roster_id);
        byMatchupId.set(m.matchup_id, list);
      }
      return Array.from(byMatchupId.entries()).map(
        ([matchupId, rosterIds]): ScheduledMatchup => ({ week, matchupId, rosterIds })
      );
    })
  );
  return perWeek.flat();
}

/** This team's opponent in each week from `fromWeek` onward (inclusive), in week order. */
export function remainingOpponents(
  schedule: ScheduledMatchup[],
  rosterId: number,
  fromWeek: number
): Array<{ week: number; opponentRosterId: number }> {
  return schedule
    .filter((m) => m.week >= fromWeek && m.rosterIds.includes(rosterId) && m.rosterIds.length === 2)
    .map((m) => ({
      week: m.week,
      opponentRosterId: m.rosterIds.find((id) => id !== rosterId)!,
    }))
    .sort((a, b) => a.week - b.week);
}

/** This team's opponents in every week before `beforeWeek`. */
export function playedOpponents(
  schedule: ScheduledMatchup[],
  rosterId: number,
  beforeWeek: number
): number[] {
  return schedule
    .filter((m) => m.week < beforeWeek && m.rosterIds.includes(rosterId) && m.rosterIds.length === 2)
    .map((m) => m.rosterIds.find((id) => id !== rosterId)!);
}
