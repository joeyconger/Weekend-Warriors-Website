import type { StorylineFacts } from "./types";

/**
 * Deterministic, template-based storyline text. Used when the Gemini call
 * fails or GEMINI_API_KEY isn't set, so the Storylines tab never shows
 * nothing — just plainer prose than the AI version.
 */
export function fallbackBody(facts: StorylineFacts): string {
  switch (facts.kind) {
    case "trade": {
      const aAhead = facts.teamA.pointsSince >= facts.teamB.pointsSince;
      const leader = aAhead ? facts.teamA : facts.teamB;
      const trailer = aAhead ? facts.teamB : facts.teamA;
      return `${facts.weeksSinceTrade} weeks after the ${facts.teamA.teamName}–${facts.teamB.teamName} trade, ${leader.teamName} is ahead on points (${leader.pointsSince.toFixed(1)} to ${trailer.pointsSince.toFixed(1)}) from the players they picked up. Still early, but the early returns favor ${leader.managerName}.`;
    }
    case "matchup": {
      if (facts.flavor === "blowout") {
        return `${facts.winner.teamName} put up ${facts.winner.points.toFixed(1)} points in Week ${facts.week}, running away from ${facts.loser.teamName} by ${facts.margin.toFixed(1)}. Not much else to say about that one.`;
      }
      return `Week ${facts.week} came down to the wire — ${facts.winner.teamName} escaped with a ${facts.margin.toFixed(1)}-point win over ${facts.loser.teamName}, ${facts.winner.points.toFixed(1)} to ${facts.loser.points.toFixed(1)}.`;
    }
    case "streak":
      return `${facts.teamName} has ${facts.streakType === "win" ? "won" : "lost"} ${facts.length} straight games heading into Week ${facts.week + 1}. ${facts.streakType === "win" ? "Nobody wants to see them on the schedule right now." : "Time to check the waiver wire."}`;
    case "waiver":
      return `${facts.teamName}'s waiver pickup of ${facts.playerName} ${facts.weeksSinceAdd} weeks ago has paid off — ${facts.pointsSinceAdd.toFixed(1)} points and counting.`;
    case "rivalry":
      return `The latest chapter in the ${facts.teamA.teamName}–${facts.teamB.teamName} rivalry went to ${facts.teamA.points >= facts.teamB.points ? facts.teamA.teamName : facts.teamB.teamName}, ${Math.max(facts.teamA.points, facts.teamB.points).toFixed(1)} to ${Math.min(facts.teamA.points, facts.teamB.points).toFixed(1)}.`;
    case "analysis": {
      const top = facts.rankings[0];
      const bottom = facts.rankings[facts.rankings.length - 1];
      return `Through Week ${facts.week}, ${top.teamName} sits at #1 (${top.wins}-${top.losses}${top.ties ? `-${top.ties}` : ""}, ${top.pointsFor.toFixed(1)} points). ${bottom.teamName} brings up the rear at #${bottom.rank} (${bottom.wins}-${bottom.losses}${bottom.ties ? `-${bottom.ties}` : ""}). Full standings on the Season tab.`;
    }
  }
}
