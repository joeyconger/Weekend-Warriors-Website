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
  it("ranks the better record/scoring team ahead with a higher title probability", () => {
    const odds = buildChampionshipOdds([
      { identity: mkIdentity("strong"), avgPoints: 130, wins: 8, ties: 0, gamesPlayed: 8 },
      { identity: mkIdentity("weak"), avgPoints: 90, wins: 2, ties: 0, gamesPlayed: 8 },
    ]);

    expect(odds[0].identity.userId).toBe("strong");
    expect(odds[0].probability).toBeGreaterThan(odds[1].probability);
  });

  it("pins #1 near the favorite endpoint and last place near the longshot endpoint, regardless of how close the real stats are", () => {
    // Deliberately tight stats — a real early-season table where every team
    // is 1-0 or 0-1 with near-identical scoring. The board should still
    // look dramatic; it shouldn't collapse toward even odds just because
    // the underlying numbers are close together.
    const tightField = Array.from({ length: 10 }, (_, i) => ({
      identity: mkIdentity(`team${i}`),
      avgPoints: 120 - i * 0.5, // a fraction of a point apart
      wins: i < 5 ? 1 : 0,
      ties: 0,
      gamesPlayed: 1,
    }));
    const odds = buildChampionshipOdds(tightField);

    expect(odds[0].americanOdds).toBe("+150");
    expect(odds[odds.length - 1].americanOdds).toBe("+7500");
  });

  it("orders every team monotonically by rank, best to worst", () => {
    const odds = buildChampionshipOdds([
      { identity: mkIdentity("best"), avgPoints: 165, wins: 11, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("mid"), avgPoints: 150, wins: 8, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("bad"), avgPoints: 135, wins: 5, ties: 0, gamesPlayed: 14 },
      { identity: mkIdentity("worst"), avgPoints: 115, wins: 2, ties: 0, gamesPlayed: 14 },
    ]);
    for (let i = 1; i < odds.length; i++) {
      expect(odds[i - 1].probability).toBeGreaterThan(odds[i].probability);
    }
    expect(odds[0].identity.userId).toBe("best");
    expect(odds[odds.length - 1].identity.userId).toBe("worst");
  });
});
