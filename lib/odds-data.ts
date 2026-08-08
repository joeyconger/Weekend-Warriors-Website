import { getAllPlayers, getLeague, getRosters } from "@/lib/sleeper/client";
import type { SleeperRoster } from "@/lib/sleeper/types";
import { regularSeasonWeeks } from "@/lib/sleeper/league-info";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { getCurrentWeek } from "@/lib/sleeper/current-week";
import { getFullSchedule, playedOpponents, remainingOpponents } from "@/lib/sleeper/schedule";
import { getWeekProjections, scoringPointsKey } from "@/lib/sleeper/projections";
import { projectTeamScore, type RosterPlayer } from "@/lib/lineup";
import {
  buildChampionshipOdds,
  buildMatchupLine,
  computeTeamPower,
  winProbability,
  type ChampionshipOdds,
  type MatchupLine,
  type WinTotal,
} from "@/lib/odds";
import { siteConfig } from "@/lib/site-config";

export interface OddsData {
  championship: ChampionshipOdds[];
  weekNumber: number | null;
  matchupLines: MatchupLine[];
  winTotals: WinTotal[];
  /** False when Sleeper's (unofficial) projections endpoint was unreachable for every remaining week — everything falls back to a flat season-average view. */
  projectionsAvailable: boolean;
}

/**
 * Gathers everything the Odds page needs. Rather than any heuristic
 * blending, every remaining week gets its own real Sleeper projection:
 * for each team, each unplayed week's score estimate is that week's
 * actual projected lineup total (via lineup.ts), matched against that
 * week's actual scheduled opponent (via schedule.ts). Played weeks use
 * real results (already reflected in season standings). This is what
 * drives Championship odds, Season Win Totals, and this week's lines —
 * all from the same per-week projection data, just aggregated
 * differently. Every external call degrades gracefully; a failure at any
 * stage falls back to season-average numbers rather than breaking the page.
 */
export async function buildOddsData(): Promise<OddsData | null> {
  const leagueId = siteConfig.sleeperLeagueId;

  const [history, league] = await Promise.all([
    getLeagueHistory(leagueId).catch(() => null),
    getLeague(leagueId).catch(() => null),
  ]);
  const currentSeason = history?.seasons[0];
  if (!currentSeason || currentSeason.standings.length === 0) return null;

  const regSeasonWeeks = league ? regularSeasonWeeks(league) : 14;

  let currentWeek: number | null = null;
  try {
    currentWeek = await getCurrentWeek();
  } catch {
    currentWeek = null;
  }
  const evalWeek = currentWeek ?? regSeasonWeeks + 1;

  const schedule = await getFullSchedule(leagueId, regSeasonWeeks).catch(() => []);
  const teams = computeTeamPower(currentSeason.standings);
  const powerByRoster = new Map(teams.map((t) => [t.rosterId, t]));

  // Per-team, per-remaining-week projected score: fetches each remaining
  // week's real Sleeper projections and runs them through the lineup
  // optimizer, one map per week. A week's fetch failing only costs that
  // week (falls back to season average for it); the whole feature only
  // goes fully flat if every remaining week fails.
  const remainingWeeks = Array.from(
    { length: Math.max(0, regSeasonWeeks - evalWeek + 1) },
    (_, i) => evalWeek + i
  );

  let rosters: SleeperRoster[] = [];
  let positionByPlayer = new Map<string, string>();
  if (league && remainingWeeks.length > 0) {
    try {
      const [rosterList, players] = await Promise.all([getRosters(leagueId), getAllPlayers()]);
      rosters = rosterList;
      positionByPlayer = new Map(Object.entries(players).map(([id, p]) => [id, p.position ?? ""]));
    } catch {
      rosters = [];
    }
  }

  const projectedScoreByRosterAndWeek = new Map<number, Map<number, number>>();
  let anyWeekProjected = false;

  if (league && rosters.length > 0) {
    const pointsKey = scoringPointsKey(league.scoring_settings?.rec ?? 0);
    const perWeekResults = await Promise.all(
      remainingWeeks.map(async (week) => {
        try {
          const projections = await getWeekProjections(league.season, week, pointsKey);
          const byRoster = new Map<number, number>();
          for (const roster of rosters) {
            if (!powerByRoster.has(roster.roster_id)) continue;
            const rosterPlayers: RosterPlayer[] = (roster.players ?? []).map((playerId) => ({
              playerId,
              position: positionByPlayer.get(playerId) ?? "",
            }));
            byRoster.set(
              roster.roster_id,
              projectTeamScore(rosterPlayers, projections, league.roster_positions)
            );
          }
          return { week, byRoster };
        } catch {
          return { week, byRoster: null };
        }
      })
    );
    for (const { week, byRoster } of perWeekResults) {
      if (byRoster && byRoster.size > 0) {
        projectedScoreByRosterAndWeek.set(week, byRoster);
        anyWeekProjected = true;
      }
    }
  }

  /** A team's estimated score for a given remaining week: its real projection if we have one, else its season average. */
  const scoreFor = (rosterId: number, week: number): number => {
    const fromProjection = projectedScoreByRosterAndWeek.get(week)?.get(rosterId);
    if (fromProjection != null) return fromProjection;
    return powerByRoster.get(rosterId)?.avgPoints ?? 0;
  };

  // Full-season projected average: actual points scored so far, plus this
  // team's per-week projected score for every remaining week, over the
  // whole season. No heuristic weighting — just real data where we have
  // it, real per-week projections where we don't yet.
  const leagueAvgActual =
    teams.reduce((sum, t) => sum + t.avgPoints, 0) / (teams.length || 1);
  const projectedSeasonAvg = new Map<number, number>();
  for (const t of teams) {
    const actualTotal = t.avgPoints * t.gamesPlayed;
    const remainingProjectedTotal = remainingWeeks.reduce(
      (sum, week) => sum + scoreFor(t.rosterId, week),
      0
    );
    projectedSeasonAvg.set(t.rosterId, (actualTotal + remainingProjectedTotal) / regSeasonWeeks);
  }
  const leagueProjectedAvg =
    Array.from(projectedSeasonAvg.values()).reduce((sum, v) => sum + v, 0) /
    (projectedSeasonAvg.size || 1);
  const projectedAvgFor = (rosterId: number) => projectedSeasonAvg.get(rosterId) ?? leagueProjectedAvg;

  // Championship odds: full-season projected average, nudged by strength of
  // schedule already played — beating a tougher slate than average signals
  // more true skill than the raw record shows.
  const championshipInputs = teams.map((t) => {
    const played = playedOpponents(schedule, t.rosterId, evalWeek);
    const playedAvg = played.length
      ? played.reduce((sum, id) => sum + projectedAvgFor(id), 0) / played.length
      : leagueAvgActual;
    const sosAdjustment = (playedAvg - leagueAvgActual) * 0.15;
    return { ...t, avgPoints: projectedAvgFor(t.rosterId) + sosAdjustment };
  });
  const championship = buildChampionshipOdds(championshipInputs);

  // Season win totals: simulate each remaining week against its actual
  // scheduled opponent, using that specific week's projected scores for both
  // sides — a real week-by-week schedule simulation, not a flat average.
  const winTotals = teams.map((t) => {
    const remaining = remainingOpponents(schedule, t.rosterId, evalWeek);
    let projectedWins = t.wins + t.ties * 0.5;
    for (const { week, opponentRosterId } of remaining) {
      projectedWins += winProbability(scoreFor(t.rosterId, week), scoreFor(opponentRosterId, week));
    }
    const rounded = Math.round(projectedWins * 2) / 2;
    const line = Number.isInteger(rounded) ? rounded + 0.5 : rounded;
    return { identity: t.identity, line, currentWins: t.wins, gamesRemaining: remaining.length };
  });

  // This week's matchup lines + totals: that week's real projected scores directly.
  const matchupLines: MatchupLine[] = [];
  if (currentWeek) {
    const thisWeek = schedule.filter((m) => m.week === currentWeek && m.rosterIds.length === 2);
    for (const m of thisWeek) {
      const [aId, bId] = m.rosterIds;
      const teamA = powerByRoster.get(aId);
      const teamB = powerByRoster.get(bId);
      if (!teamA || !teamB) continue;
      matchupLines.push(
        buildMatchupLine(
          { identity: teamA.identity, score: scoreFor(aId, currentWeek) },
          { identity: teamB.identity, score: scoreFor(bId, currentWeek) }
        )
      );
    }
  }

  return {
    championship,
    weekNumber: currentWeek,
    matchupLines,
    winTotals,
    projectionsAvailable: anyWeekProjected,
  };
}
