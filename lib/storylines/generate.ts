import { getLeague } from "@/lib/sleeper/client";
import { siteConfig } from "@/lib/site-config";
import {
  gatherMatchupFacts,
  gatherRivalryFacts,
  gatherStreakFacts,
  gatherTradeFacts,
  gatherWaiverFacts,
} from "./gather";
import { generateStorylineBody } from "./gemini";
import { dedupeKeyFor, titleFor } from "./prompt";
import { saveStoryline } from "./db";
import type { StorylineFacts } from "./types";

/**
 * Gathers this week's storyline-worthy facts across every category, asks
 * Gemini (or the template fallback) to write each one up, and caches the
 * results. Meant to run on a schedule (see scripts/generate-storylines.ts),
 * not on page load — keeps this well within Gemini's free-tier limits.
 */
export async function runStorylineGeneration(): Promise<{ generated: number; skipped: number }> {
  const leagueId = siteConfig.sleeperLeagueId;
  const league = await getLeague(leagueId);
  const season = league.season;

  const factGroups = await Promise.all([
    gatherTradeFacts(leagueId, season),
    gatherMatchupFacts(leagueId, season),
    gatherStreakFacts(leagueId, season),
    gatherWaiverFacts(leagueId, season),
    gatherRivalryFacts(leagueId, season),
  ]);
  const allFacts: StorylineFacts[] = factGroups.flat();

  let generated = 0;
  let skipped = 0;
  for (const facts of allFacts) {
    try {
      const { body, source } = await generateStorylineBody(facts);
      saveStoryline({
        type: facts.kind,
        title: titleFor(facts),
        body,
        season: facts.season,
        week: facts.week,
        managerIds: [],
        source,
        dedupeKey: dedupeKeyFor(facts),
      });
      generated++;
    } catch (err) {
      console.error("Failed to generate a storyline, skipping:", err);
      skipped++;
    }
  }

  return { generated, skipped };
}
