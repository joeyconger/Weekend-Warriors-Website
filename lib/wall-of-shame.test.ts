import { describe, expect, it } from "vitest";
import { worstRecordPerSeason } from "./wall-of-shame";
import type { SeasonStanding, SeasonSummary } from "./sleeper/history";

function mkStanding(userId: string, wins: number, pointsFor: number): SeasonStanding {
  return {
    userId,
    displayName: userId,
    teamName: userId,
    avatar: null,
    rosterId: Number(userId.replace(/\D/g, "")) || 1,
    wins,
    losses: 14 - wins,
    ties: 0,
    pointsFor,
    pointsAgainst: 0,
  };
}

describe("worstRecordPerSeason", () => {
  it("picks the fewest-wins team for each season", () => {
    const seasons: SeasonSummary[] = [
      {
        season: "2025",
        leagueId: "l2025",
        leagueName: "Weekend Warriors",
        champion: null,
        runnerUp: null,
        standings: [mkStanding("a", 10, 1500), mkStanding("b", 3, 1200), mkStanding("c", 7, 1300)],
      },
    ];

    const result = worstRecordPerSeason(seasons);
    expect(result).toHaveLength(1);
    expect(result[0].season).toBe("2025");
    expect(result[0].team.userId).toBe("b");
  });

  it("breaks a tie in wins by lowest points scored", () => {
    const seasons: SeasonSummary[] = [
      {
        season: "2024",
        leagueId: "l2024",
        leagueName: "Weekend Warriors",
        champion: null,
        runnerUp: null,
        standings: [mkStanding("a", 4, 1100), mkStanding("b", 4, 950)],
      },
    ];

    expect(worstRecordPerSeason(seasons)[0].team.userId).toBe("b");
  });

  it("skips seasons with no standings", () => {
    const seasons: SeasonSummary[] = [
      { season: "2023", leagueId: "l2023", leagueName: "x", champion: null, runnerUp: null, standings: [] },
    ];
    expect(worstRecordPerSeason(seasons)).toHaveLength(0);
  });
});
