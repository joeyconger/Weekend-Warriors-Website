import { getLeague } from "@/lib/sleeper/client";
import { siteConfig } from "@/lib/site-config";
import {
  gatherAnalysisFacts,
  gatherMatchupFacts,
  gatherRivalryFacts,
  gatherStreakFacts,
  gatherTradeFacts,
  gatherWaiverFacts,
} from "./gather";
import { generateStorylineBody } from "./gemini";
import { fallbackBody } from "./fallback";
import { dedupeKeyFor, titleFor } from "./prompt";
import { saveStoryline } from "./db";
import type { StorylineFacts } from "./types";

// Keep this well under Railway's ~5 minute proxy timeout: once a scheduled
// run's fact list gets long (more weeks of games = more matchup/streak/
// waiver facts), calling Gemini for every single one sequentially can run
// long enough to get the whole request killed with a 502, losing all of
// it. Past the deadline, remaining facts use the instant template instead
// of a Gemini call, so a run this large always finishes and saves.
const GENERATION_DEADLINE_MS = 3.5 * 60 * 1000;
const CONCURRENCY = 4;

async function generateOne(
  facts: StorylineFacts,
  deadline: number
): Promise<{ body: string; source: "gemini" | "template" }> {
  if (Date.now() >= deadline) {
    return { body: fallbackBody(facts), source: "template" };
  }
  return generateStorylineBody(facts);
}

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
    gatherAnalysisFacts(leagueId, season),
  ]);
  const allFacts: StorylineFacts[] = factGroups.flat();

  const deadline = Date.now() + GENERATION_DEADLINE_MS;
  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < allFacts.length; i += CONCURRENCY) {
    const batch = allFacts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (facts) => {
        const { body, source } = await generateOne(facts, deadline);
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
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        generated++;
      } else {
        console.error("Failed to generate a storyline, skipping:", result.reason);
        skipped++;
      }
    }
  }

  return { generated, skipped };
}
