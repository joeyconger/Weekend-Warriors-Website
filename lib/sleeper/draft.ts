import { getDraftPicks, getDrafts } from "./client";
import type { SleeperDraft, SleeperDraftPick } from "./types";

const DRAFT_TYPE_LABEL: Record<string, string> = {
  snake: "Snake",
  linear: "Linear",
  auction: "Auction",
};

export function draftTypeLabel(type: string): string {
  return DRAFT_TYPE_LABEL[type] ?? type;
}

export function formatDraftDate(startTimeMs: number | null): string {
  if (!startTimeMs) return "Not yet scheduled";
  return new Date(startTimeMs).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function draftSummaryLabel(draft: SleeperDraft | null): string {
  if (!draft) return "Not yet scheduled";
  return `${draftTypeLabel(draft.type)} — ${formatDraftDate(draft.start_time)}`;
}

/** The most recent draft for a league (current season's, once scheduled). */
export async function getCurrentDraft(leagueId: string): Promise<SleeperDraft | null> {
  const drafts = await getDrafts(leagueId);
  if (!drafts || drafts.length === 0) return null;
  return drafts.sort((a, b) => (b.start_time ?? 0) - (a.start_time ?? 0))[0];
}

export async function getDraftResults(draftId: string): Promise<SleeperDraftPick[]> {
  const picks = await getDraftPicks(draftId);
  return picks.sort((a, b) => a.pick_no - b.pick_no);
}

export interface DraftCountdown {
  targetDate: Date;
  daysRemaining: number;
  /** "sleeper" once Sleeper has next season's draft actually scheduled; "fallback" until then. */
  source: "sleeper" | "fallback";
}

/**
 * Countdown to the next draft. Prefers a real Sleeper-scheduled draft with
 * a future start_time; falls back to a manually configured date (see
 * lib/site-config.ts) until Sleeper has next season's draft created —
 * which for a dynasty league's rookie draft is often not until close to
 * the season itself.
 */
export function buildDraftCountdown(
  draft: SleeperDraft | null,
  fallbackDateStr: string,
  now: number = Date.now()
): DraftCountdown {
  if (draft?.start_time && draft.start_time > now) {
    return {
      targetDate: new Date(draft.start_time),
      daysRemaining: daysBetween(now, draft.start_time),
      source: "sleeper",
    };
  }
  const fallbackMs = new Date(`${fallbackDateStr}T00:00:00Z`).getTime();
  return {
    targetDate: new Date(fallbackMs),
    daysRemaining: daysBetween(now, fallbackMs),
    source: "fallback",
  };
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.ceil((toMs - fromMs) / (1000 * 60 * 60 * 24)));
}
