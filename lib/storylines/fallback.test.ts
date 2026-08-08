import { describe, expect, it } from "vitest";
import { fallbackBody } from "./fallback";
import type { AnalysisFacts } from "./types";

describe("fallbackBody analysis", () => {
  it("names the top and bottom team without needing Gemini", () => {
    const facts: AnalysisFacts = {
      kind: "analysis",
      season: "2026",
      week: 3,
      rankings: [
        { rank: 1, teamName: "Top Team", managerName: "Alice", wins: 3, losses: 0, ties: 0, pointsFor: 400 },
        { rank: 2, teamName: "Bottom Team", managerName: "Bob", wins: 0, losses: 3, ties: 0, pointsFor: 250 },
      ],
    };
    const body = fallbackBody(facts);
    expect(body).toContain("Top Team");
    expect(body).toContain("#1");
    expect(body).toContain("Bottom Team");
    expect(body).toContain("#2");
  });
});
