/**
 * Entry point for scheduled storyline generation — run this weekly after
 * Sleeper data refreshes (Railway cron, GitHub Actions schedule, or by
 * hand): `npm run generate-storylines`.
 */
import { runStorylineGeneration } from "@/lib/storylines/generate";

runStorylineGeneration()
  .then(({ generated, skipped }) => {
    console.log(`Storyline generation done: ${generated} saved, ${skipped} skipped.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Storyline generation failed:", err);
    process.exit(1);
  });
