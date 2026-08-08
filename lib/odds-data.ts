import { getAllPlayers, getLeague, getRosters } from "@/lib/sleeper/client";
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
  /** False when Sleeper's (unofficial) projections endpoint was unreachable — the page can note it's running on performance stats alone for this week. */
  projectionsAvailable: boolean;
}

/**
 * Gathers everything the Odds page needs: current standings (past
 * performance), the real season schedule (strength of schedule), rosters,
 * and — when reachable — Sleeper's weekly player projections for this
 * week's matchup lines. Every external call degrades gracefully; a
 * failure at any stage falls back to performance-only numbers rather than
 * breaking the page.
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
  const leagueAvgPoints = teams.reduce((sum, t) => sum + t.avgPoints, 0) / (teams.length || 1);

  const avgPointsFor = (rosterId: number) => powerByRoster.get(rosterId)?.avgPoints ?? leagueAvgPoints;

  // Championship odds: base rating nudged by strength of schedule already played —
  // beating a tougher slate than average signals more true skill than the raw record shows.
  const evalWeek = currentWeek ?? regSeasonWeeks + 1;
  const championshipInputs = teams.map((t) => {
    const played = playedOpponents(schedule, t.rosterId, evalWeek);
    const playedAvg = played.length
      ? played.reduce((sum, id) => sum + avgPointsFor(id), 0) / played.length
      : leagueAvgPoints;
    const sosAdjustment = (playedAvg - leagueAvgPoints) * 0.15;
    return { ...t, avgPoints: t.avgPoints + sosAdjustment };
  });
  const championship = buildChampionshipOdds(championshipInputs);

  // Season win totals: simulate each remaining week against its actual scheduled opponent.
  const winTotals = teams.map((t) => {
    const remaining = remainingOpponents(schedule, t.rosterId, evalWeek);
    const remainingOpponentAvgPoints = remaining.map((o) => avgPointsFor(o.opponentRosterId));
    return projectWinTotal(t, remainingOpponentAvgPoints);
  });

  // This week's matchup lines + totals: blend season performance with Sleeper's
  // weekly projections (an unofficial endpoint — falls back cleanly if it fails).
  let projectionsAvailable = false;
  let scoreEstimateByRoster = new Map<number, number>(teams.map((t) => [t.rosterId, t.avgPoints]));

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

      const blended = new Map<number, number>();
      for (const roster of rosters) {
        const power = powerByRoster.get(roster.roster_id);
        if (!power) continue;
        const rosterPlayers: RosterPlayer[] = (roster.players ?? []).map((playerId) => ({
          playerId,
          position: positionByPlayer.get(playerId) ?? "",
        }));
        const projected = projectTeamScore(rosterPlayers, projections, rosterPositions);
        blended.set(roster.roster_id, projected > 0 ? projected * 0.6 + power.avgPoints * 0.4 : power.avgPoints);
      }
      if (blended.size > 0) {
        scoreEstimateByRoster = blended;
        projectionsAvailable = true;
      }
    } catch {
      // Unofficial endpoint failed or returned an unexpected shape — stick with season averages.
    }
  }

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
          { identity: teamA.identity, score: scoreEstimateByRoster.get(aId) ?? teamA.avgPoints },
          { identity: teamB.identity, score: scoreEstimateByRoster.get(bId) ?? teamB.avgPoints }
        )
      );
    }
  }

  return { championship, weekNumber: currentWeek, matchupLines, winTotals, projectionsAvailable };
}
