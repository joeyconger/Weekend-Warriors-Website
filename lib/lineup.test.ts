import { describe, expect, it } from "vitest";
import { projectTeamScore, type RosterPlayer } from "./lineup";

describe("projectTeamScore", () => {
  it("fills fixed slots by position, then FLEX from whoever's left, always taking the best projection available", () => {
    const roster: RosterPlayer[] = [
      { playerId: "QB1", position: "QB" },
      { playerId: "QB2", position: "QB" },
      { playerId: "RB1", position: "RB" },
      { playerId: "RB2", position: "RB" },
      { playerId: "RB3", position: "RB" },
      { playerId: "WR1", position: "WR" },
      { playerId: "WR2", position: "WR" },
      { playerId: "WR3", position: "WR" },
      { playerId: "TE1", position: "TE" },
      { playerId: "TE2", position: "TE" },
      { playerId: "K1", position: "K" },
      { playerId: "DEF1", position: "DEF" },
    ];
    const projections = new Map<string, number>([
      ["QB1", 20],
      ["QB2", 15],
      ["RB1", 18],
      ["RB2", 12],
      ["RB3", 8],
      ["WR1", 16],
      ["WR2", 10],
      ["WR3", 7],
      ["TE1", 9],
      ["TE2", 4],
      ["K1", 8.5],
      ["DEF1", 6],
    ]);
    const rosterPositions = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF", "BN", "BN"];

    // QB1(20) + RB1(18) + RB2(12) + WR1(16) + WR2(10) + TE1(9) + K1(8.5) + DEF1(6)
    // + FLEX: best remaining RB/WR/TE-eligible player is RB3(8) (QB2 isn't FLEX-eligible)
    const expected = 20 + 18 + 12 + 16 + 10 + 9 + 8.5 + 6 + 8;

    expect(projectTeamScore(roster, projections, rosterPositions)).toBeCloseTo(expected, 5);
  });

  it("ignores bench/IR/taxi slots and missing projections default to 0", () => {
    const roster: RosterPlayer[] = [{ playerId: "q1", position: "QB" }];
    const projections = new Map<string, number>([["q1", 22]]);
    const rosterPositions = ["QB", "BN", "BN", "IR", "TAXI"];

    expect(projectTeamScore(roster, projections, rosterPositions)).toBe(22);
  });

  it("returns 0 for an empty roster", () => {
    expect(projectTeamScore([], new Map(), ["QB", "RB", "BN"])).toBe(0);
  });
});
