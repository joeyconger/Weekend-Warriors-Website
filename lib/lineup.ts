/**
 * Approximates a team's optimal starting lineup for a projected-points
 * total: fills fixed position slots first (QB/RB/WR/TE/K/DEF), then flex
 * slots from whoever's left, always taking the highest projection
 * available for each slot. This is an approximation of real lineup-setting
 * (it doesn't know about byes, injuries, or a manager's actual start/sit
 * choices) — good enough for a "projected score" estimate, not a precise
 * prediction.
 */

export interface RosterPlayer {
  playerId: string;
  position: string;
}

const FLEX_ELIGIBLE: Record<string, string[]> = {
  FLEX: ["RB", "WR", "TE"],
  WRRB_FLEX: ["WR", "RB"],
  REC_FLEX: ["WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
};

const NON_STARTING_SLOTS = new Set(["BN", "IR", "TAXI"]);

export function projectTeamScore(
  roster: RosterPlayer[],
  projections: Map<string, number>,
  rosterPositions: string[]
): number {
  const slots = rosterPositions.filter((p) => !NON_STARTING_SLOTS.has(p));
  const fixedSlots = slots.filter((s) => !FLEX_ELIGIBLE[s]);
  const flexSlots = slots.filter((s) => FLEX_ELIGIBLE[s]);

  const candidates = roster
    .map((p) => ({ ...p, points: projections.get(p.playerId) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const used = new Set<string>();
  let total = 0;

  for (const slot of fixedSlots) {
    const pick = candidates.find((p) => p.position === slot && !used.has(p.playerId));
    if (pick) {
      used.add(pick.playerId);
      total += pick.points;
    }
  }
  for (const slot of flexSlots) {
    const eligible = FLEX_ELIGIBLE[slot];
    const pick = candidates.find((p) => eligible.includes(p.position) && !used.has(p.playerId));
    if (pick) {
      used.add(pick.playerId);
      total += pick.points;
    }
  }

  return total;
}

/**
 * Sums a team's already-known starters' projections directly — no
 * optimizing, just what's actually set. Preferred over projectTeamScore
 * whenever a team's real starters for the week are known: it matches
 * what Sleeper itself would show as that team's projected total, which
 * can differ from the hypothetical best lineup if a manager's bench
 * isn't optimally set.
 */
export function sumProjectedPoints(playerIds: string[], projections: Map<string, number>): number {
  return playerIds.reduce((sum, id) => sum + (projections.get(id) ?? 0), 0);
}
