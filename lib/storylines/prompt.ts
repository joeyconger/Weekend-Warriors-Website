import type { StorylineFacts } from "./types";

const STYLE_INSTRUCTIONS = `You are a fantasy football blogger covering a home fantasy league. Write in an
engaging, slightly irreverent sports-blog tone — confident, a little trash-talky,
never mean-spirited. Write 2 to 4 sentences. Use the facts given; do not invent
stats, player names, or events not present in the facts. No hashtags, no emoji,
no headline — just the body text.`;

export function factsToPrompt(facts: StorylineFacts): string {
  const lines: string[] = [STYLE_INSTRUCTIONS, "", "Facts:"];

  switch (facts.kind) {
    case "trade":
      lines.push(
        `Season ${facts.season}, week ${facts.week} trade, ${facts.weeksSinceTrade} weeks ago.`,
        `${facts.teamA.teamName} (manager ${facts.teamA.managerName}) acquired: ${facts.teamA.received.join(", ")}. Points scored by those players since the trade: ${facts.teamA.pointsSince.toFixed(1)}.`,
        `${facts.teamB.teamName} (manager ${facts.teamB.managerName}) acquired: ${facts.teamB.received.join(", ")}. Points scored by those players since the trade: ${facts.teamB.pointsSince.toFixed(1)}.`,
        `Write a "who's winning this trade so far" recap.`
      );
      break;
    case "matchup":
      lines.push(
        `Season ${facts.season}, week ${facts.week} matchup.`,
        `${facts.winner.teamName} (${facts.winner.managerName}) beat ${facts.loser.teamName} (${facts.loser.managerName}), ${facts.winner.points.toFixed(1)} to ${facts.loser.points.toFixed(1)}.`,
        `Margin: ${facts.margin.toFixed(1)} points. This was a ${facts.flavor === "blowout" ? "lopsided blowout" : "nail-biting photo finish"}.`,
        `Write a recap in that spirit.`
      );
      break;
    case "streak":
      lines.push(
        `Season ${facts.season}, through week ${facts.week}.`,
        `${facts.teamName} (${facts.managerName}) is on a ${facts.length}-game ${facts.streakType === "win" ? "winning" : "losing"} streak.`,
        `Write a short hot-take about this streak.`
      );
      break;
    case "waiver":
      lines.push(
        `Season ${facts.season}, week ${facts.week}.`,
        `${facts.teamName} (${facts.managerName}) picked up ${facts.playerName} off waivers ${facts.weeksSinceAdd} weeks ago.`,
        `That player has scored ${facts.pointsSinceAdd.toFixed(1)} points since being added.`,
        `Write a "waiver wire steal" recap.`
      );
      break;
    case "rivalry":
      lines.push(
        `Season ${facts.season}, week ${facts.week} — a grudge match between tagged rivals.`,
        `${facts.teamA.teamName} (${facts.teamA.managerName}) scored ${facts.teamA.points.toFixed(1)}.`,
        `${facts.teamB.teamName} (${facts.teamB.managerName}) scored ${facts.teamB.points.toFixed(1)}.`,
        `Write this as the latest chapter in their rivalry.`
      );
      break;
    case "analysis":
      lines.push(
        `Season ${facts.season}, current standings through week ${facts.week}, ranked 1 (best) to ${facts.rankings.length} (worst):`,
        ...facts.rankings.map(
          (r) =>
            `${r.rank}. ${r.teamName} (${r.managerName}) — ${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}, ${r.pointsFor.toFixed(1)} points for.`
        ),
        `Write this as a weekly Power Rankings blurb, 4 to 6 sentences instead of the usual 2 to 4. Call out the team at the top, one notable riser or faller in the middle of the pack, and the team at the bottom — using only the records and points given above.`
      );
      break;
  }

  return lines.join("\n");
}

export function titleFor(facts: StorylineFacts): string {
  switch (facts.kind) {
    case "trade":
      return `Trade Recap: ${facts.teamA.teamName} ↔ ${facts.teamB.teamName}`;
    case "matchup":
      return facts.flavor === "blowout"
        ? `Blowout: ${facts.winner.teamName} demolishes ${facts.loser.teamName}`
        : `Nail-Biter: ${facts.winner.teamName} edges ${facts.loser.teamName}`;
    case "streak":
      return `${facts.teamName} is on a ${facts.length}-game ${facts.streakType === "win" ? "win" : "loss"} streak`;
    case "waiver":
      return `Waiver Wire Steal: ${facts.teamName}'s ${facts.playerName} pickup`;
    case "rivalry":
      return `Rivalry Update: ${facts.teamA.teamName} vs ${facts.teamB.teamName}`;
    case "analysis":
      return `Power Rankings: Week ${facts.week}`;
  }
}

/** Stable key so re-running generation doesn't create duplicate storylines. */
export function dedupeKeyFor(facts: StorylineFacts): string {
  switch (facts.kind) {
    case "trade":
      return `trade-${facts.season}-${facts.week}-${facts.teamA.teamName}-${facts.teamB.teamName}`;
    case "matchup":
      return `matchup-${facts.season}-${facts.week}-${facts.winner.teamName}-${facts.loser.teamName}`;
    case "streak":
      return `streak-${facts.season}-${facts.teamName}-${facts.streakType}-${facts.length}`;
    case "waiver":
      return `waiver-${facts.season}-${facts.week}-${facts.teamName}-${facts.playerName}`;
    case "rivalry":
      return `rivalry-${facts.season}-${facts.week}-${facts.teamA.teamName}-${facts.teamB.teamName}`;
    case "analysis":
      return `analysis-${facts.season}-${facts.week}`;
  }
}
