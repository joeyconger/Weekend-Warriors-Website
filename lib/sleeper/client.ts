import type {
  SleeperBracketMatch,
  SleeperDraft,
  SleeperDraftPick,
  SleeperLeague,
  SleeperMatchup,
  SleeperNflState,
  SleeperRoster,
  SleeperTransaction,
  SleeperUser,
} from "./types";

const BASE_URL = "https://api.sleeper.app/v1";

export class SleeperApiError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "SleeperApiError";
  }
}

/**
 * Wraps every Sleeper call with Next's ISR-style fetch cache so the site
 * stays "live" without hammering Sleeper on every request. Callers should
 * catch SleeperApiError and render a graceful fallback rather than crash
 * the page — Sleeper has no uptime SLA and this is a public, unauthenticated
 * API that can rate-limit or blip.
 */
async function sleeperFetch<T>(
  path: string,
  revalidateSeconds: number
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: revalidateSeconds },
    });
  } catch (err) {
    throw new SleeperApiError(
      `Network error reaching Sleeper: ${(err as Error).message}`,
      path
    );
  }
  if (!res.ok) {
    throw new SleeperApiError(
      `Sleeper API returned ${res.status} for ${path}`,
      path,
      res.status
    );
  }
  return res.json() as Promise<T>;
}

const FIVE_MIN = 300;
const ONE_HOUR = 3600;
const ONE_DAY = 86400;

export function getLeague(leagueId: string) {
  return sleeperFetch<SleeperLeague>(`/league/${leagueId}`, FIVE_MIN);
}

export function getRosters(leagueId: string) {
  return sleeperFetch<SleeperRoster[]>(`/league/${leagueId}/rosters`, FIVE_MIN);
}

export function getUsers(leagueId: string) {
  return sleeperFetch<SleeperUser[]>(`/league/${leagueId}/users`, FIVE_MIN);
}

export function getMatchups(leagueId: string, week: number) {
  return sleeperFetch<SleeperMatchup[]>(
    `/league/${leagueId}/matchups/${week}`,
    FIVE_MIN
  );
}

export function getWinnersBracket(leagueId: string) {
  return sleeperFetch<SleeperBracketMatch[]>(
    `/league/${leagueId}/winners_bracket`,
    ONE_HOUR
  );
}

export function getLosersBracket(leagueId: string) {
  return sleeperFetch<SleeperBracketMatch[]>(
    `/league/${leagueId}/losers_bracket`,
    ONE_HOUR
  );
}

export function getTransactions(leagueId: string, week: number) {
  return sleeperFetch<SleeperTransaction[]>(
    `/league/${leagueId}/transactions/${week}`,
    FIVE_MIN
  );
}

export function getDrafts(leagueId: string) {
  return sleeperFetch<SleeperDraft[]>(`/league/${leagueId}/drafts`, ONE_HOUR);
}

export function getDraft(draftId: string) {
  return sleeperFetch<SleeperDraft>(`/draft/${draftId}`, ONE_HOUR);
}

export function getDraftPicks(draftId: string) {
  return sleeperFetch<SleeperDraftPick[]>(
    `/draft/${draftId}/picks`,
    ONE_HOUR
  );
}

export function getNflState() {
  return sleeperFetch<SleeperNflState>(`/state/nfl`, FIVE_MIN);
}

/** Full NFL player dump, keyed by player_id. Several MB — cache aggressively. */
export function getAllPlayers() {
  return sleeperFetch<
    Record<
      string,
      { first_name?: string; last_name?: string; position?: string; team?: string }
    >
  >(`/players/nfl`, ONE_DAY);
}

export function avatarUrl(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null;
  return `https://sleepercdn.com/avatars/thumbs/${avatarId}`;
}
