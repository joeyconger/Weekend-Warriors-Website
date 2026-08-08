import { describe, expect, it } from "vitest";
import { draftOrderFromStandings } from "./draft-order";
import type { SeasonStanding } from "./sleeper/history";

function mkStanding(userId: string, wins: number, pointsFor: number): SeasonStanding {
  return {
    userId,
    displayName: userId,
    teamName: userId,
    avatar: null,
    rosterId: 1,
    wins,
    losses: 14 - wins,
    ties: 0,
    pointsFor,
    pointsAgainst: 0,
  };
}

describe("draftOrderFromStandings", () => {
  it("orders worst record first", () => {
    const order = draftOrderFromStandings([
      mkStanding("best", 12, 1600),
      mkStanding("worst", 2, 1100),
      mkStanding("middle", 7, 1300),
    ]);
    expect(order.map((s) => s.userId)).toEqual(["worst", "middle", "best"]);
  });

  it("breaks a tie in wins by fewest points scored", () => {
    const order = draftOrderFromStandings([mkStanding("a", 5, 1200), mkStanding("b", 5, 1000)]);
    expect(order.map((s) => s.userId)).toEqual(["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [mkStanding("a", 5, 1200), mkStanding("b", 2, 1000)];
    const copy = [...input];
    draftOrderFromStandings(input);
    expect(input).toEqual(copy);
  });
});
