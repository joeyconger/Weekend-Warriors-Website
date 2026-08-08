import { describe, expect, it } from "vitest";
import { buildDraftCountdown } from "./draft";
import type { SleeperDraft } from "./types";

function mkDraft(startTime: number | null): SleeperDraft {
  return {
    draft_id: "d1",
    type: "snake",
    status: "complete",
    start_time: startTime,
    season: "2026",
    league_id: "l1",
    settings: {},
  };
}

describe("buildDraftCountdown", () => {
  const now = Date.parse("2026-08-08T00:00:00Z");

  it("uses the fallback date when there's no Sleeper draft yet", () => {
    const result = buildDraftCountdown(null, "2027-05-08", now);
    expect(result.source).toBe("fallback");
    expect(result.daysRemaining).toBe(273); // Aug 8 2026 -> May 8 2027
  });

  it("uses the fallback date when the only known draft is already in the past", () => {
    const pastDraft = mkDraft(Date.parse("2026-08-01T00:00:00Z"));
    const result = buildDraftCountdown(pastDraft, "2027-05-08", now);
    expect(result.source).toBe("fallback");
  });

  it("prefers a real future Sleeper draft over the fallback", () => {
    const futureDraft = mkDraft(Date.parse("2026-12-25T00:00:00Z"));
    const result = buildDraftCountdown(futureDraft, "2027-05-08", now);
    expect(result.source).toBe("sleeper");
    expect(result.daysRemaining).toBe(139); // Aug 8 -> Dec 25 2026
  });

  it("never returns negative days remaining", () => {
    const result = buildDraftCountdown(null, "2020-01-01", now);
    expect(result.daysRemaining).toBe(0);
  });
});
