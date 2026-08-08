import type { SeasonStanding } from "@/lib/sleeper/history";

/**
 * "If the season ended today" draft order: worst record picks first, same
 * convention as a real rookie draft. Ties broken by fewest points scored
 * (the team that's been worse both on the scoreboard and in the standings
 * picks ahead of one that's merely unlucky). Doesn't account for any
 * lottery, trade, or custom tiebreaker rules a league might actually use —
 * it's a straight reverse-standings read.
 */
export function draftOrderFromStandings(standings: SeasonStanding[]): SeasonStanding[] {
  return [...standings].sort((a, b) => a.wins - b.wins || a.pointsFor - b.pointsFor);
}
