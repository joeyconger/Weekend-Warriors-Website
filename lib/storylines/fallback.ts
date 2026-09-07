import type { StorylineFacts } from "./types";

const isPickAsset = (asset: string) => /\bpick$/.test(asset);

function joinAssets(assets: string[]): string {
  if (assets.length === 1) return assets[0];
  if (assets.length === 2) return `${assets[0]} and ${assets[1]}`;
  return `${assets.slice(0, -1).join(", ")}, and ${assets[assets.length - 1]}`;
}

/** "pushing chips in" if they landed a player, "selling for the future" if it was picks-only. */
function tradePosture(assets: string[]): string {
  return assets.some((a) => !isPickAsset(a)) ? "pushing chips in to win now" : "selling off for future value";
}

/**
 * Deterministic, template-based storyline text. Used when the Gemini call
 * fails or GEMINI_API_KEY isn't set, so the Storylines tab never shows
 * nothing — just plainer prose than the AI version.
 */
export function fallbackBody(facts: StorylineFacts): string {
  switch (facts.kind) {
    case "trade": {
      const { teamA, teamB } = facts;
      const assetLine = `${teamA.teamName} landed ${joinAssets(teamA.received)}, while ${teamB.teamName} came away with ${joinAssets(teamB.received)}.`;
      const postureA = tradePosture(teamA.received);
      const postureB = tradePosture(teamB.received);
      const postureLine =
        postureA === postureB
          ? `Both sides are playing the same game here — this reads like two teams on the same timeline.`
          : `${teamA.managerName} looks like they're ${postureA}, while ${teamB.managerName} is ${postureB}.`;
      const hasStats = teamA.pointsSince > 0 || teamB.pointsSince > 0;
      const scoreLine = hasStats
        ? (() => {
            const aAhead = teamA.pointsSince >= teamB.pointsSince;
            const leader = aAhead ? teamA : teamB;
            const trailer = aAhead ? teamB : teamA;
            return `${facts.weeksSinceTrade} weeks in, the early scoreboard favors ${leader.managerName} (${leader.pointsSince.toFixed(1)} to ${trailer.pointsSince.toFixed(1)} points from what each side brought in).`;
          })()
        : `Too early to grade it on points, but the intent behind the deal is already clear.`;
      return `${assetLine} ${postureLine} ${scoreLine}`;
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
      return `Through Week ${facts.week}, ${top.teamName} sits at #1 (${top.wins}-${top.losses}${top.ties ? `-${top.ties}` : ""}, ${top.pointsFor.toFixed(1)} points) and looks like the real deal right now. Down at #${bottom.rank}, ${bottom.teamName} (${bottom.wins}-${bottom.losses}${bottom.ties ? `-${bottom.ties}` : ""}) is running out of reasons to think this is their year. Full standings on the Season tab.`;
    }
  }
}
