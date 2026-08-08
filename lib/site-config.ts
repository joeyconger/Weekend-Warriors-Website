/**
 * Single place to configure the league's identity: name, tagline, and
 * Sleeper league ID. For colors, edit the CSS variables at the top of
 * app/globals.css instead — that's the single source of truth for the
 * theme, and every banner/badge/nav element reads from it.
 */

export const siteConfig = {
  leagueName: "Weekend Warriors",
  tagline: "Placeholder tagline — tell me what you want here and I'll swap it in.",
  sleeperLeagueId:
    process.env.SLEEPER_LEAGUE_ID ?? "1315737573154390016",
  foundedYear: 2021,
  /**
   * Fallback next-draft date (YYYY-MM-DD), used for the Draft Central
   * countdown until Sleeper actually has next season's draft scheduled.
   * Once a real draft with a future start_time shows up via Sleeper, the
   * countdown switches to that automatically — update this by hand if the
   * real date ever changes before then.
   */
  nextDraftFallbackDate: "2027-05-08",
} as const;
