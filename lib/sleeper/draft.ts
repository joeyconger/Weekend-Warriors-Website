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
