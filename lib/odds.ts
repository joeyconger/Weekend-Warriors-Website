import type { ManagerIdentity, SeasonStanding } from "@/lib/sleeper/history";

/**
 * Fictional, entertainment-only "sportsbook" numbers derived from the
 * league's own actual scoring stats — not real odds, nobody's setting a
 * betting line on a home fantasy league. This is a simple logistic model
 * over average points scored, not a real predictive system.
 */

export interface TeamPower {
  identity: ManagerIdentity;
  avgPoints: number;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
}

// Rough week-to-week fantasy scoring standard deviation, in points. Tunable —
// smaller values make favorites look more dominant, larger values flatten the board.
const VARIANCE_SCALE = 16;

export function computeTeamPower(standings: SeasonStanding[]): TeamPower[] {
  return standings.map((s) => {
    const gamesPlayed = s.wins + s.losses + s.ties;
    return {
      identity: s,
      avgPoints: gamesPlayed > 0 ? s.pointsFor / gamesPlayed : 0,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      gamesPlayed,
    };
  });
}

function winProbability(avgA: number, avgB: number): number {
  const diff = avgA - avgB;
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

export interface MatchupLine {
  teamA: ManagerIdentity;
  teamB: ManagerIdentity;
  favorite: ManagerIdentity;
  spread: number; // fantasy points, always positive, favors `favorite`
  moneylineA: string;
  moneylineB: string;
}

export function buildMatchupLine(teamA: TeamPower, teamB: TeamPower): MatchupLine {
  const pA = winProbability(teamA.avgPoints, teamB.avgPoints);
  const spread = Math.round(Math.abs(teamA.avgPoints - teamB.avgPoints) * 2) / 2;
  const favorite = pA >= 0.5 ? teamA.identity : teamB.identity;
  return {
    teamA: teamA.identity,
    teamB: teamB.identity,
    favorite,
    spread,
    moneylineA: americanOdds(pA),
    moneylineB: americanOdds(1 - pA),
  };
}

export interface ChampionshipOdds {
  identity: ManagerIdentity;
  probability: number;
  americanOdds: string;
}

export function buildChampionshipOdds(teams: TeamPower[]): ChampionshipOdds[] {
  const maxAvg = Math.max(...teams.map((t) => t.avgPoints), 1);
  const scored = teams.map((t) => {
    const winPct = t.gamesPlayed > 0 ? (t.wins + t.ties * 0.5) / t.gamesPlayed : 0.5;
    const scoringRate = t.avgPoints / maxAvg;
    // Cubing spreads favorites and longshots apart, like a real futures board.
    const score = Math.pow(winPct * 0.6 + scoringRate * 0.4, 3);
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

export function buildWinTotals(teams: TeamPower[], regularSeasonWeeks: number): WinTotal[] {
  const leagueAvg = teams.reduce((sum, t) => sum + t.avgPoints, 0) / (teams.length || 1);

  return teams.map((t) => {
    const gamesRemaining = Math.max(0, regularSeasonWeeks - t.gamesPlayed);
    const pWin = winProbability(t.avgPoints, leagueAvg);
    const projectedRemainingWins = gamesRemaining * pWin;
    const rawLine = t.wins + t.ties * 0.5 + projectedRemainingWins;
    // Sportsbook-style half-point line so it can't push.
    const rounded = Math.round(rawLine * 2) / 2;
    const line = Number.isInteger(rounded) ? rounded + 0.5 : rounded;
    return { identity: t.identity, line, currentWins: t.wins, gamesRemaining };
  });
}
