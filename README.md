# Weekend Warriors

Public hub site for the Weekend Warriors fantasy football league — live
standings/rosters/records from Sleeper, plus hand-written history, recaps,
and lore. Next.js (App Router, TypeScript, Tailwind CSS), deployed on
Railway.

## Status at a glance

| Piece | Status |
|---|---|
| Design system (colors, fonts, tabbed nav) | ✅ Built — OU crimson/cream |
| Home/hero, past-champions banner, at-a-glance box | ✅ Built — **untested against live Sleeper data** (see below) |
| Managers, History (past seasons + all-time records), Season (current), Draft Central | ✅ Built — same caveat |
| Rivalries / Wall of Shame (markdown content) | ✅ Built, ships with placeholder example posts |
| Odds tab (performance + real strength of schedule + projections) | ✅ Built, math unit-tested — projections piece uses an unofficial Sleeper endpoint, see below |
| Storylines tab (AI storylines + Recaps/Analysis, all one tab) + Gemini pipeline | ✅ Built, wired to fall back to template text without a Gemini key |
| Real league colors | ✅ Oklahoma Sooners crimson/cream |
| Tagline | ❌ Empty on purpose — supply one whenever, see below |
| Founding year | ✅ 2021 |
| 2026 Season Preview (Analysis) | ✅ Live — real content, not a placeholder |
| Real recap/wall-of-shame content | ❌ Still just placeholder/example posts (rivalries, weekly recaps) |

**Why "untested against live Sleeper data":** this site was built in a
sandboxed environment whose network egress is blocked from reaching
`api.sleeper.app` entirely (confirmed via direct `curl` and `WebFetch` —
both got hard-blocked by the environment's proxy, not a Sleeper-side
error). The Sleeper integration is written against Sleeper's documented,
stable public API shape and the generation pipeline was verified
end-to-end via `npm run generate-storylines` (which correctly ran through
every step and failed only at the network call, with a clean typed
error) — but nobody has watched real Sleeper JSON flow through these
pages yet. Run `npm run dev` locally or deploy to Railway and skim each
tab; if a field name is wrong you'll see it immediately (every Sleeper
call is wrapped in a try/catch that renders a "couldn't reach Sleeper"
box instead of crashing, so a bad assumption shows up as a gap, not a
500).

## What you need to supply

1. ~~Colors~~ — done, Oklahoma Sooners crimson/cream in `app/globals.css`.
   Want something different later? Every banner, badge, and nav element
   reads from those CSS variables, so editing them alone reskins the
   whole site.
2. **Tagline** (optional) — `lib/site-config.ts`, currently empty on
   purpose (league name and founding year are already set). The homepage
   just skips the tagline line entirely while it's blank — nothing to fix
   if you never set one.
3. **Real content** — the 2026 Season Preview is live under Storylines →
   Analysis. Still placeholder: `content/rivalries/` and the one example
   post in `content/recaps/` — delete those and add your own.
4. **Rivalry tags** (optional, powers the Storylines "rivalry update"
   category) — `lib/rivalries-config.ts`.
5. **Pre-Sleeper manual records** (optional) — `lib/manual-records.ts`,
   for any league history from before it was on Sleeper.
6. **Gemini API key** (optional — the Storylines tab works without it,
   just with plainer template text) — see "Storylines" below.
7. **Next draft date** — `lib/site-config.ts`'s `nextDraftFallbackDate`
   is currently May 8, 2027 (what you told me). Draft Central's countdown
   uses this until Sleeper actually has next season's draft scheduled
   with a real date, then switches over automatically — update this by
   hand only if the real date changes before that happens.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. The Sleeper league ID defaults to the one
in `lib/site-config.ts`; override with `SLEEPER_LEAGUE_ID` in `.env.local`
if needed.

**Run the tests** (no network required — covers the Odds engine's math):

```bash
npm run test
```

## Content: Recaps, Rivalries, Wall of Shame

Each is a folder of markdown files with frontmatter — no CMS, no admin
panel, just git:

```
content/
  recaps/2026-week-01.md
  rivalries/manager-a-vs-manager-b.md
  wall-of-shame/worst-trade-2025.md
```

Frontmatter shape (see the placeholder file in each folder for a working
example):

```md
---
title: "Week 1: The Carnage Begins"
date: "2026-09-08"
excerpt: "One-line summary for the list page."
---

Full recap in markdown goes here.
```

Add a file, commit, deploy — it shows up automatically, newest `date`
first.

**Recaps also supports an `analysis` category** — add `category: "analysis"`
to a recap's frontmatter and it sorts into a separate "Analysis" section
on Storylines instead of "Weekly Recaps." Use it for season previews,
trade grades, trend pieces — anything longer-form than a single week's
recap. This is distinct from the AI-generated **Power Rankings**
storyline (see Storylines below) — different name, different content,
they don't collide. The 2026 Season Preview
(`content/recaps/2026-season-preview.md`) is a working example.

**Recaps doesn't have its own nav tab** — it's folded into Storylines
(see below), alongside the AI-generated content. Individual posts still
live at their own permalink, `/recaps/[slug]`; `/recaps` itself (the old
list page) redirects to `/storylines`.

## Odds: fictional, not real sportsbook lines

The Odds tab computes championship futures, this week's matchup lines +
game totals, and season win-total over/unders — a fun, realistic-looking
board that's live from week 1, not just once there's a performance track
record. (No disclaimer banner on the page — obviously nobody's setting a
real betting line on a home fantasy league.)

**Championship odds are deliberately dramatic** — the best and worst
teams should look like a heavy favorite and a real longshot, not bunched
together near even money. `buildChampionshipOdds` in `lib/odds.ts` raises
each team's composite win-pct/scoring-rate score to the 8th power before
normalizing into probabilities, so a modest real-world gap in record and
scoring compounds into an order-of-magnitude (or more) gap in title odds.
Tune the exponent there if it ever needs to be more or less extreme.

What actually drives the numbers:

1. **Real results, for weeks already played** — actual points scored,
   from season standings.
2. **Real per-week projections, for weeks that haven't happened yet** —
   `lib/odds-data.ts` fetches Sleeper's actual projections for *each*
   remaining week individually (not just the current one), runs each
   through a lineup optimizer (`lib/lineup.ts`) that picks a team's
   best-projected starters per position/FLEX slot, and matches that
   week's projected score against that week's *actual* scheduled
   opponent (`lib/sleeper/schedule.ts`) — a real week-by-week schedule
   simulation, not a flat average. This is what makes Championship and
   Season Win Totals meaningful in week 1, when every team's season
   average is still 0: there's no games-played heuristic anywhere, it's
   just real data where it exists and real projections where it doesn't.
3. Championship odds also get a small nudge for teams that have already
   played a tougher-than-average schedule.

The math (win-probability curve, American-odds formatting, the lineup
optimizer, the win-total projection) lives in `lib/odds.ts` and
`lib/lineup.ts` and is unit-tested (`npm run test`) with fabricated data,
since it can't be verified against a live league from this environment.

**One real caveat**: the weekly-projections piece
(`lib/sleeper/projections.ts`) calls an endpoint that is **not part of
Sleeper's documented public API** — it's a widely-used but unofficial
endpoint reverse-engineered by the fantasy-dev community, at a different
host path than the rest of the site's Sleeper calls. Each remaining
week's fetch is independent, so one bad week only costs that week's
accuracy (falls back to season average for it); if *every* remaining
week fails, the whole Odds tab falls back to season-average numbers and
shows a small note on the page. A second, milder caveat: Sleeper may not
publish meaningful projections very far into the future — how many weeks
out they're actually populated isn't something this environment could
verify.

## History vs. Season: past vs. present

Split cleanly by time, not by data type:

- **Season** (`app/season/`) — this year only: live standings and this
  week's matchups. Nothing but the current season lives here.
- **History** (`app/history/`) — everything before this year: standings
  for every past season, plus all-time records (which by nature span the
  whole league history, current season included). If the league is in
  its first year on Sleeper, the "Past Seasons" section just says so —
  there's nothing to show yet.

The records half of History walks Sleeper's full season history (via
each league's `previous_league_id` chain) to compute, automatically:

- Most / fewest points in a single game
- Biggest blowout / closest matchup
- Most points in a season
- Longest win / loss streaks
- Championships by year (from each season's playoff bracket)

This only covers seasons the league has actually played **on Sleeper**.
Anything from before that (a league that moved from ESPN/Yahoo, say), or
anything too subjective for an API (worst manager, best pick), goes in
`lib/manual-records.ts` and renders in a separate "Hand-Kept Records"
section.

`/records` redirects to `/history`, `/standings` redirects to `/season`
(`next.config.ts`) in case anything's bookmarked the old URLs.

**Wall of Shame also gets one computed table**: "Worst Record, Every
Year" (`lib/wall-of-shame.ts`), same via-Sleeper-history approach as
Records. The current season is excluded from it until it actually has a
champion (`season.champion != null`) — a mid-season "worst record" is
just noise that'll change by December, so it stays off the board until
it's final. The hand-written "Entries" section only renders when there's
actually something in `content/wall-of-shame/` — no empty-state message
on the live page.

## Draft Central: countdown + live draft order

Two live pieces on top of the existing draft settings/results:

- **Countdown** — days until the next draft. Prefers a real Sleeper draft
  once one's scheduled with a future date; until then, falls back to
  `nextDraftFallbackDate` in `lib/site-config.ts`.
- **Draft Order** — "if the season ended today," worst record picks
  first, same convention as a real rookie draft (ties broken by fewest
  points scored). Computed live from current standings
  (`lib/draft-order.ts`), so it moves every time standings do — no extra
  job or schedule needed, it just reflects whatever's current on each
  page load. Doesn't know about any lottery/trade/tiebreaker rules a
  league might actually use for draft order — it's a straight
  reverse-standings read.

## Storylines: AI storylines + human Analysis/Recaps, one tab

This tab covers three different things, stacked on one page:

1. **AI storylines** — six categories, all generated the same way: pull
   recent Sleeper activity, build a fact-only prompt, ask Gemini's
   free-tier Flash model to write it up. Runs on a schedule and caches
   results in SQLite — **not** called live on page load, to stay well
   within the free tier.
   - Trade recaps, matchup recaps (blowouts/nail-biters), hot streaks,
     waiver-wire steals, tagged rivalry updates — all short, 2-4 sentences.
   - **Power Rankings** (`analysis` storyline type — badged "Power
     Rankings" on the card, not to be confused with the human "Analysis"
     content category below) — a weekly full-league rankings blurb built
     from current standings (`gatherAnalysisFacts` in
     `lib/storylines/gather.ts`), 4-6 sentences instead of the usual 2-4,
     calling out the team on top, a notable riser/faller, and the team on
     the bottom. Fully automatic, one per week, skips itself entirely in
     week 1 (nothing to rank yet with every team at 0-0).
2. **Analysis** — human-written, long-form pieces from `content/recaps/`
   tagged `category: "analysis"` (see "Content" above) — season previews,
   trade grades, deep dives. The 2026 Season Preview lives here.
3. **Weekly Recaps** — the rest of the human-written markdown content
   from `content/recaps/`, below Analysis. Individual posts (both
   categories) have their own permalink at `/recaps/[slug]`.

**To turn on real AI generation:**

1. Get a free API key at [ai.google.dev](https://ai.google.dev) (no
   credit card required at the free tier).
2. Add to Railway → your service → Variables:
   - `GEMINI_API_KEY` = your key
   - (optional) `GEMINI_MODEL` — defaults to `gemini-2.5-flash`; check
     [ai.google.dev's model list](https://ai.google.dev/gemini-api/docs/models)
     if that name ever goes stale.

Without `GEMINI_API_KEY` set, generation still runs and still populates
the tab — `lib/storylines/fallback.ts` produces deterministic,
template-based text instead. Same for a failed/rate-limited Gemini call
at generation time: it logs the error and falls back per-storyline,
rather than skipping it.

**Running generation:**

- Locally / manually: `npm run generate-storylines`
- On a schedule: `.github/workflows/generate-storylines.yml` is a GitHub
  Actions cron job (Tuesdays 09:00 UTC, i.e. after Monday Night Football)
  that calls the deployed site's `/api/generate-storylines` endpoint.
  Requires two **GitHub repo secrets** (Settings → Secrets and variables
  → Actions):
  - `SITE_URL` — the deployed site's URL (e.g.
    `https://weekend-warriors-website.up.railway.app`)
  - `GENERATION_SECRET` — any random string; must match the Railway env
    var of the same name (below)

**Rivalry tagging:** to get "rivalry update" storylines, tag manager
pairs by their Sleeper display name in `lib/rivalries-config.ts`.

## Deploy to Railway

1. **railway.app** → New Project → **Deploy from GitHub repo** →
   `joeyconger/weekend-warriors-website`.
2. **Volume** (Settings → Volumes → New Volume), mount path `/data` — this
   is where the storylines SQLite cache lives, so it survives redeploys.
3. **Variables**:
   - `DATABASE_PATH=/data/storylines.db`
   - `GEMINI_API_KEY` (optional, see above)
   - `GEMINI_MODEL` (optional)
   - `GENERATION_SECRET` (only needed if using the GitHub Actions
     scheduled generation — any random string, must match the GitHub
     secret of the same name)
   - `SLEEPER_LEAGUE_ID` (optional override of the hardcoded default)
4. **Networking → Generate Domain.**

Railway's Nixpacks builder auto-detects Next.js (`npm run build` /
`npm run start`); `next start` reads Railway's `$PORT` automatically.
Healthcheck is `/api/health`.

## Project layout

```
app/                    Next.js App Router — one folder per tab
  page.tsx                Home/hero
  managers/ history/ season/ draft/               Sleeper-backed pages
  recaps/[slug]/           weekly recap permalinks (no list page — folded into storylines/)
  rivalries/ wall-of-shame/                       markdown content pages
  odds/                   fictional odds board (championship/week/win totals)
  storylines/            AI storylines + Recaps/Analysis, one tab
  api/health/             Railway healthcheck
  api/generate-storylines/  protected endpoint the cron job calls
components/             Shared UI (nav, cards, tables, banners)
lib/
  site-config.ts          league name/tagline/Sleeper ID/next draft fallback date
  manual-records.ts        pre-Sleeper / subjective records
  wall-of-shame.ts          worst-record-per-year computation — unit-tested
  draft-order.ts            worst-to-first draft order from standings — unit-tested
  rivalries-config.ts       tagged rivalry pairs
  content.ts               markdown+frontmatter loader (recaps/rivalries/wall-of-shame)
  odds.ts                 pure odds math (win probability, spreads, championship, win totals) — unit-tested
  odds-data.ts              orchestrator: wires standings + schedule + projections together
  lineup.ts                pure starting-lineup projector — unit-tested
  sleeper/                 Sleeper API client, types, season-history walker
    schedule.ts               full season schedule + remaining/played opponents
    projections.ts            unofficial weekly-projections endpoint client
    draft.ts                  draft settings/results + countdown — unit-tested
  storylines/               fact-gathering, prompt building, Gemini client,
                             template fallback, SQLite cache, orchestrator
content/                 recaps/ rivalries/ wall-of-shame/ markdown posts
scripts/generate-storylines.ts   CLI entry point for the generation job

# Old URLs redirect (next.config.ts):
#   /records    -> /history
#   /standings  -> /season
#   /recaps     -> /storylines   (but /recaps/[slug] permalinks still work)
```
