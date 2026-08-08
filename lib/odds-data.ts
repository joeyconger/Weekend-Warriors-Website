import { getAllPlayers, getLeague, getRosters } from "@/lib/sleeper/client";
import type { SleeperRoster } from "@/lib/sleeper/types";
import { regularSeasonWeeks } from "@/lib/sleeper/league-info";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { getCurrentWeek } from "@/lib/sleeper/current-week";
import { getFullSchedule, playedOpponents, remainingOpponents } from "@/lib/sleeper/schedule";
import { getWeekProjections, scoringPointsKey } from "@/lib/sleeper/projections";
import { projectTeamScore, sumProjectedPoints, type RosterPlayer } from "@/lib/lineup";
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
 * for each team, each unplayed week's score estimate prefers that team's
 * actual currently-set starters for the week (summing their individual
 * projections — the same math Sleeper's own UI uses), falling back to a
 * lineup optimizer only when starters aren't known yet, and to season
 * average only when projections themselves are unavailable. Played weeks
 * use real results (already reflected in season standings). Every
 * external call degrades gracefully; a failure at any stage falls back
 * rather than breaking the page.
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

  const { matchups: schedule, startersByWeek } = await getFullSchedule(leagueId, regSeasonWeeks).catch(
    () => ({ matchups: [], startersByWeek: new Map() })
  );
  const teams = computeTeamPower(currentSeason.standings);
  const powerByRoster = new Map(teams.map((t) => [t.rosterId, t]));

  // Per-team, per-remaining-week data: fetches each remaining week's real
  // Sleeper projections once, then reuses it two ways per team — summing
  // actual starters directly (preferred, matches Sleeper's own math) or,
  // when starters aren't known for that week, running the lineup
  // optimizer as a substitute. A week's fetch failing only costs that
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

  const optimizerScoreByRosterAndWeek = new Map<number, Map<number, number>>();
  const rawProjectionsByWeek = new Map<number, Map<string, number>>();
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
          return { week, byRoster, projections };
        } catch {
          return { week, byRoster: null, projections: null };
        }
      })
    );
    for (const { week, byRoster, projections } of perWeekResults) {
      if (byRoster && byRoster.size > 0) {
        optimizerScoreByRosterAndWeek.set(week, byRoster);
        anyWeekProjected = true;
      }
      if (projections) {
        rawProjectionsByWeek.set(week, projections);
      }
    }
  }

  /** A team's estimated score for a given remaining week: actual set starters summed against real projections (matches Sleeper's own number) > lineup-optimizer guess > season average. */
  const scoreFor = (rosterId: number, week: number): number => {
    const starters = startersByWeek.get(week)?.get(rosterId);
    const projections = rawProjectionsByWeek.get(week);
    if (starters && starters.length > 0 && projections) {
      return sumProjectedPoints(starters, projections);
    }
    const fromOptimizer = optimizerScoreByRosterAndWeek.get(week)?.get(rosterId);
    if (fromOptimizer != null) return fromOptimizer;
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
    projectionsAvailable: anyWeekProjected || rawProjectionsByWeek.size > 0,
  };
}
