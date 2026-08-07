import { unstable_cache } from "next/cache";
import {
  getLeague,
  getMatchups,
  getRosters,
  getUsers,
  getWinnersBracket,
} from "./client";
import type { SleeperLeague, SleeperUser } from "./types";

export interface ManagerIdentity {
  userId: string;
  displayName: string;
  teamName: string;
  avatar: string | null;
}

export interface SeasonStanding extends ManagerIdentity {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface SeasonSummary {
  season: string;
  leagueId: string;
  leagueName: string;
  standings: SeasonStanding[];
  champion: ManagerIdentity | null;
  runnerUp: ManagerIdentity | null;
}

export interface AllTimeManagerStat extends ManagerIdentity {
  titles: number;
  titleYears: string[];
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  seasonsPlayed: number;
}

export interface GameRecord {
  points: number;
  manager: ManagerIdentity;
  season: string;
  week: number;
}

export interface MarginRecord {
  margin: number;
  winner: ManagerIdentity;
  winnerPoints: number;
  loser: ManagerIdentity;
  loserPoints: number;
  season: string;
  week: number;
}

export interface StreakRecord {
  length: number;
  manager: ManagerIdentity;
  startSeason: string;
  startWeek: number;
  endSeason: string;
  endWeek: number;
}

export interface AllTimeRecords {
  mostPointsGame: GameRecord | null;
  fewestPointsGame: GameRecord | null;
  biggestBlowout: MarginRecord | null;
  closestMatchup: MarginRecord | null;
  mostPointsSeason: { points: number; manager: ManagerIdentity; season: string } | null;
  longestWinStreak: StreakRecord | null;
  longestLossStreak: StreakRecord | null;
}

export interface LeagueHistory {
  seasons: SeasonSummary[]; // most recent first
  managers: AllTimeManagerStat[]; // sorted by titles desc, then wins desc
  records: AllTimeRecords;
}

function teamIdentity(user: SleeperUser | undefined, rosterId: number): ManagerIdentity {
  if (!user) {
    return {
      userId: `unknown-${rosterId}`,
      displayName: "Unknown Manager",
      teamName: `Team ${rosterId}`,
      avatar: null,
    };
  }
  return {
    userId: user.user_id,
    displayName: user.display_name,
    teamName: user.metadata?.team_name?.trim() || user.display_name,
    avatar: user.avatar,
  };
}

/** Walks previous_league_id backward. Returns league objects, most recent first. */
async function walkSeasonChain(startLeagueId: string): Promise<SleeperLeague[]> {
  const chain: SleeperLeague[] = [];
  let currentId: string | null = startLeagueId;
  const seen = new Set<string>();

  while (currentId && currentId !== "0" && !seen.has(currentId)) {
    seen.add(currentId);
    const league = await getLeague(currentId);
    chain.push(league);
    currentId = league.previous_league_id;
  }

  return chain;
}

async function loadSeasonSummary(league: SleeperLeague): Promise<SeasonSummary> {
  const [rosters, users] = await Promise.all([
    getRosters(league.league_id),
    getUsers(league.league_id),
  ]);
  const usersById = new Map(users.map((u) => [u.user_id, u]));

  const standings: SeasonStanding[] = rosters
    .filter((r) => r.owner_id)
    .map((r) => {
      const identity = teamIdentity(usersById.get(r.owner_id!), r.roster_id);
      return {
        ...identity,
        rosterId: r.roster_id,
        wins: r.settings.wins ?? 0,
        losses: r.settings.losses ?? 0,
        ties: r.settings.ties ?? 0,
        pointsFor: pointsFromSettings(r.settings.fpts, r.settings.fpts_decimal),
        pointsAgainst: pointsFromSettings(
          r.settings.fpts_against,
          r.settings.fpts_against_decimal
        ),
      };
    })
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

  const rosterById = new Map(rosters.map((r) => [r.roster_id, r]));

  let champion: ManagerIdentity | null = null;
  let runnerUp: ManagerIdentity | null = null;
  if (league.status === "complete") {
    try {
      const bracket = await getWinnersBracket(league.league_id);
      const championMatch = bracket.find((m) => m.p === 1);
      if (championMatch?.w != null) {
        const winnerRoster = rosterById.get(championMatch.w);
        if (winnerRoster?.owner_id) {
          champion = teamIdentity(usersById.get(winnerRoster.owner_id), championMatch.w);
        }
        if (championMatch.l != null) {
          const loserRoster = rosterById.get(championMatch.l);
          if (loserRoster?.owner_id) {
            runnerUp = teamIdentity(usersById.get(loserRoster.owner_id), championMatch.l);
          }
        }
      }
    } catch {
      // Bracket not available (e.g. mid-season, or league predates brackets) — leave null.
    }
  }

  return {
    season: league.season,
    leagueId: league.league_id,
    leagueName: league.name,
    standings,
    champion,
    runnerUp,
  };
}

function pointsFromSettings(whole?: number, decimal?: number): number {
  return (whole ?? 0) + (decimal ?? 0) / 100;
}

/** Walks every played week's matchups for a season. Stops at the first empty week. */
async function loadSeasonGames(
  leagueId: string,
  maxWeeks = 18
): Promise<Map<number, Array<{ rosterId: number; points: number; matchupId: number }>>> {
  const byWeek = new Map<
    number,
    Array<{ rosterId: number; points: number; matchupId: number }>
  >();

  for (let week = 1; week <= maxWeeks; week++) {
    const matchups = await getMatchups(leagueId, week);
    if (!matchups || matchups.length === 0) break;
    byWeek.set(
      week,
      matchups
        .filter((m) => m.matchup_id != null)
        .map((m) => ({
          rosterId: m.roster_id,
          points: m.points ?? 0,
          matchupId: m.matchup_id as number,
        }))
    );
  }

  return byWeek;
}

async function computeHistory(startLeagueId: string): Promise<LeagueHistory> {
  const chain = await walkSeasonChain(startLeagueId);
  if (chain.length === 0) {
    return {
      seasons: [],
      managers: [],
      records: {
        mostPointsGame: null,
        fewestPointsGame: null,
        biggestBlowout: null,
        closestMatchup: null,
        mostPointsSeason: null,
        longestWinStreak: null,
        longestLossStreak: null,
      },
    };
  }

  const seasons = await Promise.all(chain.map(loadSeasonSummary));

  // All-time manager aggregation, keyed by stable Sleeper user_id.
  const managerMap = new Map<string, AllTimeManagerStat>();
  for (const summary of seasons) {
    for (const standing of summary.standings) {
      const existing = managerMap.get(standing.userId);
      const isChampion = summary.champion?.userId === standing.userId;
      if (existing) {
        existing.wins += standing.wins;
        existing.losses += standing.losses;
        existing.ties += standing.ties;
        existing.pointsFor += standing.pointsFor;
        existing.pointsAgainst += standing.pointsAgainst;
        existing.seasonsPlayed += 1;
        if (isChampion) {
          existing.titles += 1;
          existing.titleYears.push(summary.season);
        }
        // Keep the most recent team name/avatar (standings are most-recent-first order).
      } else {
        managerMap.set(standing.userId, {
          userId: standing.userId,
          displayName: standing.displayName,
          teamName: standing.teamName,
          avatar: standing.avatar,
          titles: isChampion ? 1 : 0,
          titleYears: isChampion ? [summary.season] : [],
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
          seasonsPlayed: 1,
        });
      }
    }
  }
  const managers = Array.from(managerMap.values()).sort(
    (a, b) => b.titles - a.titles || b.wins - a.wins
  );

  // Per-game / streak records: walk chronologically, oldest season first.
  const chronological = [...seasons].reverse();
  const records: AllTimeRecords = {
    mostPointsGame: null,
    fewestPointsGame: null,
    biggestBlowout: null,
    closestMatchup: null,
    mostPointsSeason: null,
    longestWinStreak: null,
    longestLossStreak: null,
  };

  // manager result sequences for streak detection, in chronological order
  const resultSequences = new Map<
    string,
    Array<{ season: string; week: number; result: "W" | "L" | "T" }>
  >();

  for (const summary of chronological) {
    const identityByRoster = new Map(
      summary.standings.map((s) => [s.rosterId, s] as const)
    );

    // most points in a season (regular-season total from roster settings)
    for (const standing of summary.standings) {
      if (
        !records.mostPointsSeason ||
        standing.pointsFor > records.mostPointsSeason.points
      ) {
        records.mostPointsSeason = {
          points: standing.pointsFor,
          manager: standing,
          season: summary.season,
        };
      }
    }

    let games: Map<number, Array<{ rosterId: number; points: number; matchupId: number }>>;
    try {
      games = await loadSeasonGames(summary.leagueId);
    } catch {
      continue; // couldn't load game-by-game data for this season — skip its per-game records
    }

    for (const [week, entries] of games) {
      const byMatchup = new Map<number, typeof entries>();
      for (const entry of entries) {
        const list = byMatchup.get(entry.matchupId) ?? [];
        list.push(entry);
        byMatchup.set(entry.matchupId, list);
      }

      for (const pair of byMatchup.values()) {
        for (const entry of pair) {
          const identity = identityByRoster.get(entry.rosterId);
          if (!identity) continue;

          if (!records.mostPointsGame || entry.points > records.mostPointsGame.points) {
            records.mostPointsGame = {
              points: entry.points,
              manager: identity,
              season: summary.season,
              week,
            };
          }
          if (
            entry.points > 0 &&
            (!records.fewestPointsGame || entry.points < records.fewestPointsGame.points)
          ) {
            records.fewestPointsGame = {
              points: entry.points,
              manager: identity,
              season: summary.season,
              week,
            };
          }
        }

        if (pair.length === 2) {
          const [a, b] = pair;
          const idA = identityByRoster.get(a.rosterId);
          const idB = identityByRoster.get(b.rosterId);
          if (idA && idB) {
            const margin = Math.abs(a.points - b.points);
            const [winnerEntry, loserEntry] =
              a.points >= b.points ? [a, b] : [b, a];
            const winnerId = a.points >= b.points ? idA : idB;
            const loserId = a.points >= b.points ? idB : idA;
            const marginRecord: MarginRecord = {
              margin,
              winner: winnerId,
              winnerPoints: winnerEntry.points,
              loser: loserId,
              loserPoints: loserEntry.points,
              season: summary.season,
              week,
            };
            if (!records.biggestBlowout || margin > records.biggestBlowout.margin) {
              records.biggestBlowout = marginRecord;
            }
            if (margin > 0 && (!records.closestMatchup || margin < records.closestMatchup.margin)) {
              records.closestMatchup = marginRecord;
            }

            const resultA: "W" | "L" | "T" =
              a.points === b.points ? "T" : a.points > b.points ? "W" : "L";
            const resultB: "W" | "L" | "T" =
              a.points === b.points ? "T" : b.points > a.points ? "W" : "L";
            for (const [id, result] of [
              [idA.userId, resultA],
              [idB.userId, resultB],
            ] as const) {
              const seq = resultSequences.get(id) ?? [];
              seq.push({ season: summary.season, week, result });
              resultSequences.set(id, seq);
            }
          }
        }
      }
    }

  }

  // Longest win/loss streaks across each manager's chronological game log.
  for (const [userId, seq] of resultSequences) {
    const identity = managerMap.get(userId);
    if (!identity) continue;

    let currentType: "W" | "L" | null = null;
    let runStart = 0;
    for (let i = 0; i <= seq.length; i++) {
      const g = seq[i];
      const matchesRun = g && (g.result === "W" || g.result === "L") && g.result === currentType;
      if (!matchesRun) {
        if (currentType && i - runStart >= 2) {
          const start = seq[runStart];
          const end = seq[i - 1];
          const streak: StreakRecord = {
            length: i - runStart,
            manager: identity,
            startSeason: start.season,
            startWeek: start.week,
            endSeason: end.season,
            endWeek: end.week,
          };
          if (currentType === "W") {
            if (!records.longestWinStreak || streak.length > records.longestWinStreak.length) {
              records.longestWinStreak = streak;
            }
          } else {
            if (!records.longestLossStreak || streak.length > records.longestLossStreak.length) {
              records.longestLossStreak = streak;
            }
          }
        }
        currentType = g && (g.result === "W" || g.result === "L") ? g.result : null;
        runStart = i;
      }
    }
  }

  return { seasons, managers, records };
}

/**
 * Full league history (champions, all-time manager stats, all-time
 * box-score records) computed by walking Sleeper's previous_league_id
 * chain. This does dozens of API calls, so it's cached for a day —
 * history only changes when a new week/season completes.
 */
export const getLeagueHistory = unstable_cache(
  async (leagueId: string) => computeHistory(leagueId),
  ["league-history"],
  { revalidate: 86400, tags: ["league-history"] }
);
