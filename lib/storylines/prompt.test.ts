import { describe, expect, it } from "vitest";
import { dedupeKeyFor, factsToPrompt, titleFor } from "./prompt";
import type { AnalysisFacts } from "./types";

const facts: AnalysisFacts = {
  kind: "analysis",
  season: "2026",
  week: 3,
  rankings: [
    { rank: 1, teamName: "Top Team", managerName: "Alice", wins: 3, losses: 0, ties: 0, pointsFor: 400 },
    { rank: 2, teamName: "Mid Team", managerName: "Bob", wins: 1, losses: 2, ties: 0, pointsFor: 300 },
    { rank: 3, teamName: "Bottom Team", managerName: "Cy", wins: 0, losses: 3, ties: 0, pointsFor: 250 },
  ],
};

describe("analysis storyline facts", () => {
  it("builds a title from the week number", () => {
    expect(titleFor(facts)).toBe("Power Rankings: Week 3");
  });

  it("builds a stable, season+week-scoped dedupe key", () => {
    expect(dedupeKeyFor(facts)).toBe("analysis-2026-3");
  });

  it("includes every team's record in the prompt, in rank order", () => {
    const prompt = factsToPrompt(facts);
    expect(prompt).toContain("1. Top Team (Alice) — 3-0, 400.0 points for.");
    expect(prompt).toContain("2. Mid Team (Bob) — 1-2, 300.0 points for.");
    expect(prompt).toContain("3. Bottom Team (Cy) — 0-3, 250.0 points for.");
    expect(prompt).toContain("4 to 6 sentences");
  });
});
