/**
 * Sleeper's weekly player-projections endpoint. UNLIKE the rest of
 * lib/sleeper/client.ts, this is NOT part of Sleeper's documented public
 * API (docs.sleeper.com only covers league/roster/user/matchup/draft
 * endpoints) — it's a widely-used but unofficial endpoint reverse-engineered
 * by the fantasy-dev community, at a different host path
 * (api.sleeper.app/projections/... rather than /v1/...).
 *
 * Treat this as genuinely unverified: the shape below is the commonly
 * documented one, but it could differ, rate-limit, or disappear without
 * notice. Every caller MUST catch SleeperProjectionsError and fall back to
 * season-average points instead (see lib/odds-data.ts) — the Odds page
 * should never depend on this succeeding.
 */

export type ScoringPointsKey = "pts_ppr" | "pts_half_ppr" | "pts_std";

export function scoringPointsKey(recValue: number): ScoringPointsKey {
  if (recValue >= 1) return "pts_ppr";
  if (recValue >= 0.5) return "pts_half_ppr";
  return "pts_std";
}

export class SleeperProjectionsError extends Error {}

interface ProjectionRow {
  player_id?: string;
  stats?: Record<string, number>;
}

const OFFENSE_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

/** Returns player_id -> projected points for the given week, using the league's scoring format. */
export async function getWeekProjections(
  season: string,
  week: number,
  pointsKey: ScoringPointsKey
): Promise<Map<string, number>> {
  const params = new URLSearchParams({ season_type: "regular" });
  for (const position of OFFENSE_POSITIONS) params.append("position[]", position);

  let res: Response;
  try {
    res = await fetch(
      `https://api.sleeper.app/projections/nfl/${season}/${week}?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );
  } catch (err) {
    throw new SleeperProjectionsError(`Network error reaching Sleeper projections: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw new SleeperProjectionsError(`Sleeper projections returned ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new SleeperProjectionsError("Unexpected projections response shape (expected an array)");
  }

  const byPlayer = new Map<string, number>();
  for (const row of data as ProjectionRow[]) {
    if (!row.player_id || !row.stats) continue;
    const points = row.stats[pointsKey] ?? row.stats.pts_ppr ?? row.stats.pts_std ?? 0;
    byPlayer.set(row.player_id, points);
  }
  return byPlayer;
}
