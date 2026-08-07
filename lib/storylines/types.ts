export type StorylineType =
  | "trade"
  | "matchup"
  | "streak"
  | "waiver"
  | "rivalry";

export interface Storyline {
  id: number;
  type: StorylineType;
  title: string;
  body: string;
  season: string;
  week: number | null;
  managerIds: string[];
  source: "gemini" | "template";
  createdAt: string;
  dedupeKey: string;
}

export interface TradeFacts {
  kind: "trade";
  season: string;
  week: number;
  teamA: { teamName: string; managerName: string; received: string[]; pointsSince: number };
  teamB: { teamName: string; managerName: string; received: string[]; pointsSince: number };
  weeksSinceTrade: number;
}

export interface MatchupFacts {
  kind: "matchup";
  season: string;
  week: number;
  flavor: "blowout" | "nailbiter";
  winner: { teamName: string; managerName: string; points: number };
  loser: { teamName: string; managerName: string; points: number };
  margin: number;
}

export interface StreakFacts {
  kind: "streak";
  season: string;
  week: number;
  teamName: string;
  managerName: string;
  streakType: "win" | "loss";
  length: number;
}

export interface WaiverFacts {
  kind: "waiver";
  season: string;
  week: number;
  teamName: string;
  managerName: string;
  playerName: string;
  pointsSinceAdd: number;
  weeksSinceAdd: number;
}

export interface RivalryFacts {
  kind: "rivalry";
  season: string;
  week: number;
  teamA: { teamName: string; managerName: string; points: number };
  teamB: { teamName: string; managerName: string; points: number };
}

export type StorylineFacts =
  | TradeFacts
  | MatchupFacts
  | StreakFacts
  | WaiverFacts
  | RivalryFacts;
