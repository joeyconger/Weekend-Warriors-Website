import type { ManagerIdentity, SeasonStanding } from "@/lib/sleeper/history";

/**
 * Fictional, entertainment-only "sportsbook" numbers derived from the
 * league's own actual scoring stats, strength of schedule, and (when
 * reachable) Sleeper's weekly projections — not real odds, nobody's
 * setting a betting line on a home fantasy league. Every function in this
 * file is pure and unit-tested (see lib/odds.test.ts); the network-facing
 * data gathering lives in lib/odds-data.ts.
 */

// Rough week-to-week fantasy scoring standard deviation, in points. Tunable —
// smaller values make favorites look more dominant, larger values flatten the board.
const VARIANCE_SCALE = 16;

export interface TeamPower {
  identity: ManagerIdentity;
  rosterId: number;
  avgPoints: number;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
}

export function computeTeamPower(standings: SeasonStanding[]): TeamPower[] {
  return standings.map((s) => {
    const gamesPlayed = s.wins + s.losses + s.ties;
    return {
      identity: s,
      rosterId: s.rosterId,
      avgPoints: gamesPlayed > 0 ? s.pointsFor / gamesPlayed : 0,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      gamesPlayed,
    };
  });
}

export function winProbability(scoreA: number, scoreB: number): number {
  const diff = scoreA - scoreB;
  return 1 / (1 + Math.pow(10, -diff / VARIANCE_SCALE));
}

/** Formats a win probability as American odds, e.g. -150 or +130. */
export function americanOdds(probability: number): string {
  const p = Math.min(0.99, Math.max(0.01, probability));
  if (p >= 0.5) {
    const odds = Math.round(((-100 * p) / (1 - p)) / 5) * 5;
    return `${odds}`;
  }
  const odds = Math.round(((100 * (1 - p)) / p) / 5) * 5;
  return `+${odds}`;
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export interface ScoredTeam {
  identity: ManagerIdentity;
  score: number;
}

export interface MatchupLine {
  teamA: ManagerIdentity;
  teamB: ManagerIdentity;
  favorite: ManagerIdentity;
  spread: number; // points, always positive, favors `favorite`
  total: number; // combined projected score, over/under
  moneylineA: string;
  moneylineB: string;
}

export function buildMatchupLine(teamA: ScoredTeam, teamB: ScoredTeam): MatchupLine {
  const pA = winProbability(teamA.score, teamB.score);
  const spread = roundHalf(Math.abs(teamA.score - teamB.score));
  const total = roundHalf(teamA.score + teamB.score);
  const favorite = pA >= 0.5 ? teamA.identity : teamB.identity;
  return {
    teamA: teamA.identity,
    teamB: teamB.identity,
    favorite,
    spread,
    total,
    moneylineA: americanOdds(pA),
    moneylineB: americanOdds(1 - pA),
  };
}

export interface ChampionshipInput {
  identity: ManagerIdentity;
  avgPoints: number;
  wins: number;
  ties: number;
  gamesPlayed: number;
}

export interface ChampionshipOdds {
  identity: ManagerIdentity;
  probability: number;
  americanOdds: string;
}

// Calibrated endpoints for the championship board: the #1 team should read
// like a clear favorite (+150 ≈ 40% to win it all — realistic for a full
// fantasy season, where even the best team has to survive 14+ weeks plus
// playoffs), and the last-place team like a real longshot (+7500 ≈ 1.3%).
// This is a *rank*-based interpolation, not a formula on the raw stats —
// deliberately so, because how close real teams' records/points happen to
// be shouldn't change how dramatic the board looks. #1 is always close to
// the favorite endpoint and last is always close to the longshot endpoint;
// everyone else is spaced smoothly (geometrically) between them by rank.
const CHAMPIONSHIP_FAVORITE_PROBABILITY = 0.4; // +150
const CHAMPIONSHIP_LONGSHOT_PROBABILITY = 100 / (100 + 7500); // +7500

export function buildChampionshipOdds(teams: ChampionshipInput[]): ChampionshipOdds[] {
  const maxAvg = Math.max(...teams.map((t) => t.avgPoints), 1);
  const ranked = teams
    .map((t) => {
      const winPct = t.gamesPlayed > 0 ? (t.wins + t.ties * 0.5) / t.gamesPlayed : 0.5;
      const scoringRate = Math.max(t.avgPoints, 0) / maxAvg;
      return { team: t, composite: winPct * 0.6 + scoringRate * 0.4 };
    })
    .sort((a, b) => b.composite - a.composite);

  const n = ranked.length;
  const ratio = CHAMPIONSHIP_LONGSHOT_PROBABILITY / CHAMPIONSHIP_FAVORITE_PROBABILITY;

  return ranked.map(({ team }, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const probability = CHAMPIONSHIP_FAVORITE_PROBABILITY * Math.pow(ratio, t);
    return {
      identity: team.identity,
      probability,
      americanOdds: americanOdds(probability),
    };
  });
}

export interface WinTotal {
  identity: ManagerIdentity;
  line: number; // e.g. 8.5
  currentWins: number;
  gamesRemaining: number;
}

/**
 * Projects a full-season win total by simulating each remaining week
 * against its actual scheduled opponent's power rating (real strength of
 * schedule), rather than a flat league-average opponent.
 */
export function projectWinTotal(
  team: { identity: ManagerIdentity; avgPoints: number; wins: number; ties: number },
  remainingOpponentAvgPoints: number[]
): WinTotal {
  let projectedWins = team.wins + team.ties * 0.5;
  for (const oppAvg of remainingOpponentAvgPoints) {
    projectedWins += winProbability(team.avgPoints, oppAvg);
  }
  const rounded = roundHalf(projectedWins);
  // Sportsbook-style half-point line so it can't push.
  const line = Number.isInteger(rounded) ? rounded + 0.5 : rounded;
  return {
    identity: team.identity,
    line,
    currentWins: team.wins,
    gamesRemaining: remainingOpponentAvgPoints.length,
  };
}
