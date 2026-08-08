import {
  getAllPlayers,
  getMatchups,
  getRosters,
  getTransactions,
  getUsers,
} from "@/lib/sleeper/client";
import { getCurrentWeek } from "@/lib/sleeper/current-week";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { rivalryTags } from "@/lib/rivalries-config";
import type {
  AnalysisFacts,
  MatchupFacts,
  RivalryFacts,
  StreakFacts,
  TradeFacts,
  WaiverFacts,
} from "./types";

const LOOKBACK_WEEKS = 4;

interface TeamContext {
  rosterId: number;
  userId: string | null;
  teamName: string;
  managerName: string;
}

async function loadTeamContexts(leagueId: string): Promise<Map<number, TeamContext>> {
  const [rosters, users] = await Promise.all([getRosters(leagueId), getUsers(leagueId)]);
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const map = new Map<number, TeamContext>();
  for (const r of rosters) {
    const user = r.owner_id ? usersById.get(r.owner_id) : undefined;
    map.set(r.roster_id, {
      rosterId: r.roster_id,
      userId: r.owner_id,
      teamName: user?.metadata?.team_name?.trim() || user?.display_name || `Team ${r.roster_id}`,
      managerName: user?.display_name ?? "Unknown Manager",
    });
  }
  return map;
}

async function playerNameLookup(): Promise<Map<string, string>> {
  const players = await getAllPlayers();
  const map = new Map<string, string>();
  for (const [id, p] of Object.entries(players)) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name) map.set(id, name);
  }
  return map;
}

/** points_points totals per (roster, player) across a week range, inclusive. */
async function playerPointsByRosterInRange(
  leagueId: string,
  fromWeek: number,
  toWeek: number
): Promise<Map<number, Map<string, number>>> {
  const byRoster = new Map<number, Map<string, number>>();
  for (let week = fromWeek; week <= toWeek; week++) {
    const matchups = await getMatchups(leagueId, week).catch(() => []);
    for (const m of matchups) {
      if (!m.players_points) continue;
      const rosterMap = byRoster.get(m.roster_id) ?? new Map<string, number>();
      for (const [playerId, points] of Object.entries(m.players_points)) {
        rosterMap.set(playerId, (rosterMap.get(playerId) ?? 0) + points);
      }
      byRoster.set(m.roster_id, rosterMap);
    }
  }
  return byRoster;
}

export async function gatherTradeFacts(leagueId: string, season: string): Promise<TradeFacts[]> {
  const currentWeek = await getCurrentWeek();
  const fromWeek = Math.max(1, currentWeek - LOOKBACK_WEEKS);
  const [teams, names] = await Promise.all([loadTeamContexts(leagueId), playerNameLookup()]);

  const trades: Array<{ week: number; rosterIds: number[]; adds: Record<string, number> }> = [];
  for (let week = fromWeek; week <= currentWeek; week++) {
    const txns = await getTransactions(leagueId, week).catch(() => []);
    for (const t of txns) {
      if (t.type !== "trade" || t.status !== "complete" || !t.adds) continue;
      trades.push({ week, rosterIds: t.roster_ids, adds: t.adds });
    }
  }
  if (trades.length === 0) return [];

  const pointsByRoster = await playerPointsByRosterInRange(leagueId, fromWeek, currentWeek);

  const facts: TradeFacts[] = [];
  for (const trade of trades) {
    const [rosterA, rosterB] = trade.rosterIds;
    if (rosterA == null || rosterB == null) continue;
    const teamA = teams.get(rosterA);
    const teamB = teams.get(rosterB);
    if (!teamA || !teamB) continue;

    const receivedA = Object.entries(trade.adds)
      .filter(([, roster]) => roster === rosterA)
      .map(([playerId]) => names.get(playerId) ?? playerId);
    const receivedB = Object.entries(trade.adds)
      .filter(([, roster]) => roster === rosterB)
      .map(([playerId]) => names.get(playerId) ?? playerId);
    if (receivedA.length === 0 || receivedB.length === 0) continue;

    const pointsSince = (rosterId: number) => {
      const rosterPoints = pointsByRoster.get(rosterId);
      if (!rosterPoints) return 0;
      return Object.entries(trade.adds)
        .filter(([, r]) => r === rosterId)
        .reduce((sum, [playerId]) => sum + (rosterPoints.get(playerId) ?? 0), 0);
    };

    facts.push({
      kind: "trade",
      season,
      week: trade.week,
      teamA: {
        teamName: teamA.teamName,
        managerName: teamA.managerName,
        received: receivedA,
        pointsSince: pointsSince(rosterA),
      },
      teamB: {
        teamName: teamB.teamName,
        managerName: teamB.managerName,
        received: receivedB,
        pointsSince: pointsSince(rosterB),
      },
      weeksSinceTrade: currentWeek - trade.week,
    });
  }
  return facts;
}

export async function gatherMatchupFacts(leagueId: string, season: string): Promise<MatchupFacts[]> {
  const currentWeek = await getCurrentWeek();
  const previousWeek = currentWeek - 1;
  if (previousWeek < 1) return [];

  const [matchups, teams] = await Promise.all([
    getMatchups(leagueId, previousWeek).catch(() => []),
    loadTeamContexts(leagueId),
  ]);

  const byMatchupId = new Map<number, typeof matchups>();
  for (const m of matchups) {
    if (m.matchup_id == null) continue;
    const list = byMatchupId.get(m.matchup_id) ?? [];
    list.push(m);
    byMatchupId.set(m.matchup_id, list);
  }

  const pairs = Array.from(byMatchupId.values()).filter((p) => p.length === 2);
  if (pairs.length === 0) return [];

  const withMargin = pairs.map((pair) => {
    const [a, b] = pair;
    const margin = Math.abs(a.points - b.points);
    const [winner, loser] = a.points >= b.points ? [a, b] : [b, a];
    return { winner, loser, margin };
  });

  const biggestBlowout = withMargin.reduce((max, cur) => (cur.margin > max.margin ? cur : max));
  const closest = withMargin.reduce((min, cur) => (cur.margin < min.margin ? cur : min));

  const facts: MatchupFacts[] = [];
  const toFacts = (
    entry: (typeof withMargin)[number],
    flavor: MatchupFacts["flavor"]
  ): MatchupFacts | null => {
    const winnerTeam = teams.get(entry.winner.roster_id);
    const loserTeam = teams.get(entry.loser.roster_id);
    if (!winnerTeam || !loserTeam) return null;
    return {
      kind: "matchup",
      season,
      week: previousWeek,
      flavor,
      winner: { teamName: winnerTeam.teamName, managerName: winnerTeam.managerName, points: entry.winner.points },
      loser: { teamName: loserTeam.teamName, managerName: loserTeam.managerName, points: entry.loser.points },
      margin: entry.margin,
    };
  };

  const blowout = toFacts(biggestBlowout, "blowout");
  if (blowout && blowout.margin >= 30) facts.push(blowout);
  const nailbiter = toFacts(closest, "nailbiter");
  if (nailbiter && nailbiter.margin > 0 && nailbiter.margin <= 5) facts.push(nailbiter);

  return facts;
}

export async function gatherStreakFacts(leagueId: string, season: string): Promise<StreakFacts[]> {
  const currentWeek = await getCurrentWeek();
  const teams = await loadTeamContexts(leagueId);

  const sequences = new Map<number, Array<"W" | "L" | "T">>();
  for (let week = 1; week < currentWeek; week++) {
    const matchups = await getMatchups(leagueId, week).catch(() => []);
    const byMatchupId = new Map<number, typeof matchups>();
    for (const m of matchups) {
      if (m.matchup_id == null) continue;
      const list = byMatchupId.get(m.matchup_id) ?? [];
      list.push(m);
      byMatchupId.set(m.matchup_id, list);
    }
    for (const pair of byMatchupId.values()) {
      if (pair.length !== 2) continue;
      const [a, b] = pair;
      const resultA = a.points === b.points ? "T" : a.points > b.points ? "W" : "L";
      const resultB = a.points === b.points ? "T" : b.points > a.points ? "W" : "L";
      for (const [rosterId, result] of [
        [a.roster_id, resultA],
        [b.roster_id, resultB],
      ] as const) {
        const seq = sequences.get(rosterId) ?? [];
        seq.push(result);
        sequences.set(rosterId, seq);
      }
    }
  }

  const facts: StreakFacts[] = [];
  for (const [rosterId, seq] of sequences) {
    const team = teams.get(rosterId);
    if (!team || seq.length === 0) continue;
    const last = seq[seq.length - 1];
    if (last === "T") continue;
    let length = 0;
    for (let i = seq.length - 1; i >= 0 && seq[i] === last; i--) length++;
    if (length >= 3) {
      facts.push({
        kind: "streak",
        season,
        week: currentWeek - 1,
        teamName: team.teamName,
        managerName: team.managerName,
        streakType: last === "W" ? "win" : "loss",
        length,
      });
    }
  }
  return facts;
}

export async function gatherWaiverFacts(leagueId: string, season: string): Promise<WaiverFacts[]> {
  const currentWeek = await getCurrentWeek();
  const fromWeek = Math.max(1, currentWeek - LOOKBACK_WEEKS);
  const [teams, names] = await Promise.all([loadTeamContexts(leagueId), playerNameLookup()]);

  const adds: Array<{ week: number; rosterId: number; playerId: string }> = [];
  for (let week = fromWeek; week <= currentWeek; week++) {
    const txns = await getTransactions(leagueId, week).catch(() => []);
    for (const t of txns) {
      if (t.type === "trade" || t.status !== "complete" || !t.adds) continue;
      for (const [playerId, rosterId] of Object.entries(t.adds)) {
        adds.push({ week, rosterId, playerId });
      }
    }
  }
  if (adds.length === 0) return [];

  const pointsByRoster = await playerPointsByRosterInRange(leagueId, fromWeek, currentWeek);

  const facts = adds
    .map((add) => {
      const team = teams.get(add.rosterId);
      const rosterPoints = pointsByRoster.get(add.rosterId);
      const pointsSinceAdd = rosterPoints?.get(add.playerId) ?? 0;
      if (!team) return null;
      const fact: WaiverFacts = {
        kind: "waiver",
        season,
        week: add.week,
        teamName: team.teamName,
        managerName: team.managerName,
        playerName: names.get(add.playerId) ?? add.playerId,
        pointsSinceAdd,
        weeksSinceAdd: currentWeek - add.week,
      };
      return fact;
    })
    .filter((f): f is WaiverFacts => f !== null && f.pointsSinceAdd >= 20)
    .sort((a, b) => b.pointsSinceAdd - a.pointsSinceAdd)
    .slice(0, 3);

  return facts;
}

export async function gatherRivalryFacts(leagueId: string, season: string): Promise<RivalryFacts[]> {
  if (rivalryTags.length === 0) return [];
  const currentWeek = await getCurrentWeek();
  const previousWeek = currentWeek - 1;
  if (previousWeek < 1) return [];

  const [matchups, teams] = await Promise.all([
    getMatchups(leagueId, previousWeek).catch(() => []),
    loadTeamContexts(leagueId),
  ]);
  const byMatchupId = new Map<number, typeof matchups>();
  for (const m of matchups) {
    if (m.matchup_id == null) continue;
    const list = byMatchupId.get(m.matchup_id) ?? [];
    list.push(m);
    byMatchupId.set(m.matchup_id, list);
  }

  const facts: RivalryFacts[] = [];
  for (const pair of byMatchupId.values()) {
    if (pair.length !== 2) continue;
    const [a, b] = pair;
    const teamA = teams.get(a.roster_id);
    const teamB = teams.get(b.roster_id);
    if (!teamA || !teamB) continue;
    const isRivalry = rivalryTags.some(
      (tag) =>
        (tag.managerA === teamA.managerName && tag.managerB === teamB.managerName) ||
        (tag.managerA === teamB.managerName && tag.managerB === teamA.managerName)
    );
    if (!isRivalry) continue;
    facts.push({
      kind: "rivalry",
      season,
      week: previousWeek,
      teamA: { teamName: teamA.teamName, managerName: teamA.managerName, points: a.points },
      teamB: { teamName: teamB.teamName, managerName: teamB.managerName, points: b.points },
    });
  }
  return facts;
}

/** Weekly Power Rankings: current standings, worst-to-best avoided — actual rank order. */
export async function gatherAnalysisFacts(leagueId: string, season: string): Promise<AnalysisFacts[]> {
  const currentWeek = await getCurrentWeek();
  const history = await getLeagueHistory(leagueId);
  const standings = history.seasons[0]?.standings ?? [];
  const gamesPlayed = standings.some((s) => s.wins + s.losses + s.ties > 0);
  if (!gamesPlayed) return []; // week 1, nothing to rank yet

  return [
    {
      kind: "analysis",
      season,
      week: Math.max(1, currentWeek - 1),
      rankings: standings.map((s, i) => ({
        rank: i + 1,
        teamName: s.teamName,
        managerName: s.displayName,
        wins: s.wins,
        losses: s.losses,
        ties: s.ties,
        pointsFor: s.pointsFor,
      })),
    },
  ];
}
