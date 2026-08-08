import { getAllPlayers, getLeague, getRosters } from "@/lib/sleeper/client";
import { regularSeasonWeeks } from "@/lib/sleeper/league-info";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { getCurrentWeek } from "@/lib/sleeper/current-week";
import { getFullSchedule, playedOpponents, remainingOpponents } from "@/lib/sleeper/schedule";
import { getWeekProjections, scoringPointsKey } from "@/lib/sleeper/projections";
import { projectTeamScore, type RosterPlayer } from "@/lib/lineup";
import {
  blendPowerRating,
  buildChampionshipOdds,
  buildMatchupLine,
  computeTeamPower,
  projectWinTotal,
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
  /** False when Sleeper's (unofficial) projections endpoint was unreachable — early-season numbers fall back to a flat performance-only view until real games accumulate. */
  projectionsAvailable: boolean;
}

// How many games of real results it takes before a team's power rating trusts
// season performance over its preseason/early-season projection entirely.
// Below this, Championship and Win Totals lean on Sleeper's projections instead
// of raw averages — otherwise week 1 (0 games played, avgPoints = 0 for
// everyone) would show every team as identical.
const PERFORMANCE_TRUST_GAMES = 6;

/**
 * Gathers everything the Odds page needs: current standings (past
 * performance), the real season schedule (strength of schedule), rosters,
 * and — when reachable — Sleeper's weekly player projections. Every
 * external call degrades gracefully; a failure at any stage falls back to
 * performance-only numbers rather than breaking the page.
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

  const schedule = await getFullSchedule(leagueId, regSeasonWeeks).catch(() => []);
  const teams = computeTeamPower(currentSeason.standings);
  const powerByRoster = new Map(teams.map((t) => [t.rosterId, t]));

  // Sleeper's weekly projections, if reachable — used both as this week's score
  // estimate and, blended with season performance, as every team's power rating.
  let projectionsAvailable = false;
  const rawProjectionByRoster = new Map<number, number>();

  if (currentWeek && league) {
    try {
      const pointsKey = scoringPointsKey(league.scoring_settings?.rec ?? 0);
      const [projections, rosters, players] = await Promise.all([
        getWeekProjections(league.season, currentWeek, pointsKey),
        getRosters(leagueId),
        getAllPlayers(),
      ]);
      const positionByPlayer = new Map(Object.entries(players).map(([id, p]) => [id, p.position ?? ""]));
      const rosterPositions = league.roster_positions;

      for (const roster of rosters) {
        if (!powerByRoster.has(roster.roster_id)) continue;
        const rosterPlayers: RosterPlayer[] = (roster.players ?? []).map((playerId) => ({
          playerId,
          position: positionByPlayer.get(playerId) ?? "",
        }));
        rawProjectionByRoster.set(
          roster.roster_id,
          projectTeamScore(rosterPlayers, projections, rosterPositions)
        );
      }
      if (rawProjectionByRoster.size > 0) projectionsAvailable = true;
    } catch {
      // Unofficial endpoint failed or returned an unexpected shape — everything
      // below falls back to season-performance-only, which still works, just flatter.
    }
  }

  // Power rating: blends season performance with the projection, weighted by
  // how many real games this team has actually played. Early season this is
  // almost entirely projection-driven (so Championship/Win Totals aren't just
  // a flat tie across the whole league); by mid-season it's almost entirely
  // actual performance.
  const powerRating = new Map<number, number>();
  for (const t of teams) {
    const projected = rawProjectionByRoster.get(t.rosterId) ?? null;
    powerRating.set(
      t.rosterId,
      blendPowerRating(t.avgPoints, t.gamesPlayed, projected, PERFORMANCE_TRUST_GAMES)
    );
  }
  const leaguePowerAvg =
    Array.from(powerRating.values()).reduce((sum, v) => sum + v, 0) / (powerRating.size || 1);
  const powerFor = (rosterId: number) => powerRating.get(rosterId) ?? leaguePowerAvg;

  // Championship odds: power rating nudged by strength of schedule already played —
  // beating a tougher slate than average signals more true skill than the raw record shows.
  const evalWeek = currentWeek ?? regSeasonWeeks + 1;
  const championshipInputs = teams.map((t) => {
    const played = playedOpponents(schedule, t.rosterId, evalWeek);
    const playedAvg = played.length
      ? played.reduce((sum, id) => sum + powerFor(id), 0) / played.length
      : leaguePowerAvg;
    const sosAdjustment = (playedAvg - leaguePowerAvg) * 0.15;
    return { ...t, avgPoints: powerFor(t.rosterId) + sosAdjustment };
  });
  const championship = buildChampionshipOdds(championshipInputs);

  // Season win totals: simulate each remaining week against its actual scheduled
  // opponent's power rating (real strength of schedule, not a league average).
  const winTotals = teams.map((t) => {
    const remaining = remainingOpponents(schedule, t.rosterId, evalWeek);
    const remainingOpponentPower = remaining.map((o) => powerFor(o.opponentRosterId));
    return projectWinTotal({ ...t, avgPoints: powerFor(t.rosterId) }, remainingOpponentPower);
  });

  // This week's matchup lines + totals: blend season performance with this
  // week's specific projection (a tighter, more immediate estimate than the
  // season-long power rating above).
  const matchupLines: MatchupLine[] = [];
  if (currentWeek) {
    const thisWeek = schedule.filter((m) => m.week === currentWeek && m.rosterIds.length === 2);
    for (const m of thisWeek) {
      const [aId, bId] = m.rosterIds;
      const teamA = powerByRoster.get(aId);
      const teamB = powerByRoster.get(bId);
      if (!teamA || !teamB) continue;
      const scoreFor = (rosterId: number, team: typeof teamA) => {
        const projected = rawProjectionByRoster.get(rosterId);
        return projected != null && projected > 0 ? projected * 0.6 + team.avgPoints * 0.4 : team.avgPoints;
      };
      matchupLines.push(
        buildMatchupLine(
          { identity: teamA.identity, score: scoreFor(aId, teamA) },
          { identity: teamB.identity, score: scoreFor(bId, teamB) }
        )
      );
    }
  }

  return { championship, weekNumber: currentWeek, matchupLines, winTotals, projectionsAvailable };
}
