/**
 * Minimal typed subsets of Sleeper's public API responses — only the
 * fields this site actually reads. Sleeper's API is undocumented-but-
 * stable; these shapes are widely relied upon by the fantasy-dev
 * community. Reference: https://docs.sleeper.com/
 */

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  status: string;
  sport: string;
  previous_league_id: string | null;
  draft_id: string | null;
  avatar: string | null;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  settings: {
    playoff_week_start?: number;
    playoff_teams?: number;
    playoff_type?: number;
    trade_deadline?: number;
    waiver_type?: number;
    num_teams?: number;
    leg?: number;
    [key: string]: number | undefined;
  };
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata?: {
    team_name?: string;
    [key: string]: unknown;
  };
  is_owner?: boolean | null;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  co_owners?: string[] | null;
  league_id: string;
  players: string[] | null;
  starters: string[] | null;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal?: number;
    fpts_against: number;
    fpts_against_decimal?: number;
    waiver_position?: number;
    [key: string]: number | undefined;
  };
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number;
  starters: string[];
  players: string[];
  players_points: Record<string, number> | null;
  custom_points: number | null;
}

export interface SleeperBracketMatch {
  r: number; // round
  m: number; // match id
  t1: number | { w?: number; l?: number } | null;
  t2: number | { w?: number; l?: number } | null;
  w: number | null; // winning roster_id, once played
  l: number | null;
  p?: number; // place awarded by this match (1 = championship, 3 = third place, ...)
}

export interface SleeperTransaction {
  transaction_id: string;
  type: "trade" | "waiver" | "free_agent";
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  draft_picks: Array<{
    season: string;
    round: number;
    roster_id: number;
    owner_id: number;
    previous_owner_id: number;
  }>;
  waiver_budget: Array<{ sender: number; receiver: number; amount: number }>;
  created: number; // epoch ms
  leg: number; // week number
}

export interface SleeperDraft {
  draft_id: string;
  type: string; // "snake" | "linear" | "auction"
  status: string;
  start_time: number | null; // epoch ms
  season: string;
  league_id: string;
  settings: {
    rounds?: number;
    teams?: number;
    [key: string]: number | undefined;
  };
}

export interface SleeperDraftPick {
  round: number;
  pick_no: number;
  roster_id: number;
  player_id: string;
  picked_by: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
    position?: string;
    team?: string;
    [key: string]: unknown;
  };
}

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: string;
  league_season: string;
}
