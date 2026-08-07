import type { SleeperLeague } from "./types";

export function scoringFormatLabel(league: SleeperLeague): string {
  const rec = league.scoring_settings?.rec ?? 0;
  if (rec >= 1) return "Full PPR";
  if (rec >= 0.5) return "Half PPR";
  if (rec > 0) return `${rec} pt/reception`;
  return "Standard (no PPR)";
}

export function rosterPositionsSummary(league: SleeperLeague): { position: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const pos of league.roster_positions) {
    counts.set(pos, (counts.get(pos) ?? 0) + 1);
  }
  // Stable, readable order.
  const order = ["QB", "RB", "WR", "TE", "FLEX", "SUPER_FLEX", "WRRB_FLEX", "REC_FLEX", "K", "DEF", "BN", "IR", "TAXI"];
  return Array.from(counts.entries())
    .sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([position, count]) => ({ position, count }));
}

export function playoffStructureLabel(league: SleeperLeague): string {
  const teams = league.settings.playoff_teams;
  const start = league.settings.playoff_week_start;
  if (!teams || !start) return "Not yet set";
  return `${teams}-team playoff bracket starting week ${start}`;
}

export function tradeDeadlineLabel(league: SleeperLeague): string {
  const week = league.settings.trade_deadline;
  if (!week) return "No trade deadline set";
  return `Week ${week}`;
}
