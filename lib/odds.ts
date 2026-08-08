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

/**
 * Blends season-to-date performance with a projection into a single power
 * rating, weighted by how many real games have been played. Early in the
 * season (few/no games played) this leans almost entirely on the
 * projection — otherwise every team would look identical in week 1, since
 * avgPoints is 0 for everyone before any games are played. By the time
 * `trustGames` games have been played, it's pure performance.
 */
export function blendPowerRating(
  avgPoints: number,
  gamesPlayed: number,
  projected: number | null,
  trustGames: number
): number {
  if (projected == null) return avgPoints;
  const trust = Math.min(gamesPlayed / trustGames, 1);
  return trust * avgPoints + (1 - trust) * projected;
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

export function buildChampionshipOdds(teams: ChampionshipInput[]): ChampionshipOdds[] {
  const maxAvg = Math.max(...teams.map((t) => t.avgPoints), 1);
  const scored = teams.map((t) => {
    const winPct = t.gamesPlayed > 0 ? (t.wins + t.ties * 0.5) / t.gamesPlayed : 0.5;
    const scoringRate = Math.max(t.avgPoints, 0) / maxAvg;
    // Cubing spreads favorites and longshots apart, like a real futures board.
    const score = Math.pow(Math.max(winPct * 0.6 + scoringRate * 0.4, 0.001), 3);
    return { team: t, score };
  });
  const total = scored.reduce((sum, s) => sum + s.score, 0) || 1;

  return scored
    .map(({ team, score }) => {
      const probability = score / total;
      return {
        identity: team.identity,
        probability,
        americanOdds: americanOdds(probability),
      };
    })
    .sort((a, b) => b.probability - a.probability);
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
