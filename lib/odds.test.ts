import { describe, expect, it } from "vitest";
import {
  americanOdds,
  buildChampionshipOdds,
  buildMatchupLine,
  projectWinTotal,
  winProbability,
} from "./odds";
import type { ManagerIdentity } from "./sleeper/history";

function mkIdentity(userId: string): ManagerIdentity {
  return { userId, displayName: userId, teamName: userId, avatar: null };
}

describe("winProbability", () => {
  it("is 0.5 for evenly matched teams", () => {
    expect(winProbability(100, 100)).toBeCloseTo(0.5, 5);
  });

  it("favors the higher score", () => {
    expect(winProbability(120, 100)).toBeGreaterThan(0.5);
    expect(winProbability(100, 120)).toBeLessThan(0.5);
  });

  it("is symmetric", () => {
    const a = winProbability(120, 100);
    const b = winProbability(100, 120);
    expect(a + b).toBeCloseTo(1, 5);
  });
});

describe("americanOdds", () => {
  it("gives favorites negative odds", () => {
    expect(americanOdds(0.75)).toBe("-300");
  });

  it("gives underdogs positive odds", () => {
    expect(americanOdds(0.25)).toBe("+300");
  });

  it("clamps extreme probabilities instead of producing infinite odds", () => {
    expect(americanOdds(1)).toBe("-9900");
    expect(americanOdds(0)).toBe("+9900");
  });
});

describe("buildMatchupLine", () => {
  it("favors the higher-scoring team with a positive spread and a sensible total", () => {
    const line = buildMatchupLine(
      { identity: mkIdentity("a"), score: 120 },
      { identity: mkIdentity("b"), score: 100 }
    );
    expect(line.favorite.userId).toBe("a");
    expect(line.spread).toBe(20);
    expect(line.total).toBe(220);
    expect(line.moneylineA.startsWith("-")).toBe(true);
    expect(line.moneylineB.startsWith("+")).toBe(true);
  });
});

describe("projectWinTotal", () => {
  it("adds fractional projected wins for each remaining opponent", () => {
    const result = projectWinTotal(
      { identity: mkIdentity("x"), avgPoints: 110, wins: 5, ties: 0 },
      [100, 100, 100]
    );
    expect(result.currentWins).toBe(5);
    expect(result.gamesRemaining).toBe(3);
    // Favored in all three remaining games, so the total should land clearly above 5.
    expect(result.line).toBeGreaterThan(5);
    expect(result.line).toBeLessThanOrEqual(8);
  });

  it("nudges an exact-integer projection off the line to avoid a push", () => {
    const result = projectWinTotal(
      { identity: mkIdentity("x"), avgPoints: 100, wins: 5, ties: 0 },
      [] // no games left, so the raw projection is exactly 5
    );
    expect(result.line).toBe(5.5);
  });
});

describe("buildChampionshipOdds", () => {
  it("ranks the better record/scoring team ahead and returns probabilities that sum to ~1", () => {
    const odds = buildChampionshipOdds([
      { identity: mkIdentity("strong"), avgPoints: 130, wins: 8, ties: 0, gamesPlayed: 8 },
      { identity: mkIdentity("weak"), avgPoints: 90, wins: 2, ties: 0, gamesPlayed: 8 },
    ]);

    expect(odds[0].identity.userId).toBe("strong");
    expect(odds[0].probability).toBeGreaterThan(odds[1].probability);
    const total = odds.reduce((sum, o) => sum + o.probability, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("separates the best and worst team dramatically, not bunched near even odds", () => {
    const odds = buildChampionshipOdds([
      { identity: mkIdentity("best"), avgPoints: 165, wins: 11, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("mid"), avgPoints: 150, wins: 8, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("bad"), avgPoints: 135, wins: 5, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("worst"), avgPoints: 115, wins: 2, ties: 0, gamesPlayed: 14 },
    ]);
    const best = odds.find((o) => o.identity.userId === "best")!;
    const worst = odds.find((o) => o.identity.userId === "worst")!;
    // A modest ~2x gap in record/scoring should compound into an order of
    // magnitude (or more) gap in title probability.
    expect(best.probability / worst.probability).toBeGreaterThan(50);
    expect(best.probability).toBeGreaterThan(0.5); // heavy favorite, not just "leading"
  });
});
