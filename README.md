# Weekend Warriors

Public hub site for the Weekend Warriors fantasy football league — live
standings/rosters/records from Sleeper, plus hand-written history, recaps,
and lore. Next.js (App Router, TypeScript, Tailwind CSS), deployed on
Railway.

## Status at a glance

| Piece | Status |
|---|---|
| Design system (colors, fonts, tabbed nav) | ✅ Built |
| Home/hero, past-champions banner, at-a-glance box | ✅ Built — **untested against live Sleeper data** (see below) |
| Managers, Records, Season, Standings, Draft Central | ✅ Built — same caveat |
| Recaps / Rivalries / Wall of Shame (markdown content) | ✅ Built, ships with placeholder example posts |
| Storylines tab + Gemini generation pipeline | ✅ Built, wired to fall back to template text without a Gemini key |
| Real league colors, tagline, founding year | ❌ **Placeholder values — needs input, see below** |
| Real recap/rivalry/wall-of-shame content | ❌ Placeholder example posts only |

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

1. **Colors** — edit the CSS variables at the top of `app/globals.css`
   (currently a placeholder navy/gold). Every banner, badge, and nav
   element reads from these, so this alone reskins the whole site.
2. **League name, tagline, founding year** — `lib/site-config.ts`.
3. **Real content** — delete the placeholder posts in `content/recaps/`,
   `content/rivalries/`, `content/wall-of-shame/` and add your own (see
   below).
4. **Rivalry tags** (optional, powers the Storylines "rivalry update"
   category) — `lib/rivalries-config.ts`.
5. **Pre-Sleeper manual records** (optional) — `lib/manual-records.ts`,
   for any league history from before it was on Sleeper.
6. **Gemini API key** (optional — the Storylines tab works without it,
   just with plainer template text) — see "Storylines" below.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. The Sleeper league ID defaults to the one
in `lib/site-config.ts`; override with `SLEEPER_LEAGUE_ID` in `.env.local`
if needed.

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

## Records: what's automatic vs. what you supply

The Records page walks Sleeper's full season history (via each league's
`previous_league_id` chain) to compute, automatically:

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

## Storylines: the AI-generated tab

Pulls recent Sleeper activity (trades, matchups, streaks, waiver adds,
tagged rivalries), builds a fact-only prompt per storyline, and asks
Gemini's free-tier Flash model to write 2-4 sentences of sports-blog
prose. Runs on a schedule and caches results in SQLite — **not** called
live on page load, to stay well within the free tier.

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
  managers/ records/ season/ standings/ draft/   Sleeper-backed pages
  recaps/ rivalries/ wall-of-shame/               markdown content pages
  storylines/            AI-generated storylines tab
  api/health/             Railway healthcheck
  api/generate-storylines/  protected endpoint the cron job calls
components/             Shared UI (nav, cards, tables, banners)
lib/
  site-config.ts          league name/tagline/Sleeper ID
  manual-records.ts        pre-Sleeper / subjective records
  rivalries-config.ts       tagged rivalry pairs
  content.ts               markdown+frontmatter loader
  sleeper/                 Sleeper API client, types, season-history walker
  storylines/               fact-gathering, prompt building, Gemini client,
                             template fallback, SQLite cache, orchestrator
content/                 recaps/ rivalries/ wall-of-shame/ markdown posts
scripts/generate-storylines.ts   CLI entry point for the generation job
```
