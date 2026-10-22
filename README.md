# DEVACTIVITY BLOG

Markdown dev blog for learning Rust in public.

## Stack

- Astro 7 + MDX + Content Collections
- Tailwind CSS v4 
- Cloudflare Pages / GitHub Pages (static `dist/`)
- RSS built-in, no DB
- YouTube + TikTok embeds

## Develop

```bash
npm install
npm run dev
```

## Content

- Scans every post in `src/content/blog/**` (titles, slugs, tags, both languages)
- The brief requires: **both** `en/` + `id/` files with the **same slug**

Bilingual means 2 files per post. If a translation is missing, the post simply appears only in its own language index, and the EN|ID switcher falls
back to that language's blog index. Nothing breaks.

```md
---
title: "Title"
description: "Summary"
lang: "en" # or "id"
pubDate: 2026-10-13
tags: ["rust"]
category: "CODE"
no: "03"
youtubeId: "PASTE_11_CHAR_ID"
tiktokId: "PASTE_NUMERIC_ID"
---
```

`draft: true` hides it. UI strings live in `src/i18n.ts`. Header has an EN | ID switcher to keep the same article when a translation exists.

For inline video inside MDX:

```mdx
import YouTube from '../../components/YouTube.astro';
import TikTok from '../../components/TikTok.astro';

<YouTube id="PASTE_11_CHAR_ID" title="Demo" />
<TikTok id="PASTE_NUMERIC_ID" caption="60s tip" />
```

## Dark mode

Header toggle. Stored in `localStorage`, defaults to `prefers-color-scheme`, implemented with Tailwind `@custom-variant dark`

## Live indicator (YouTube)

A pill below the header appears only when a stream is scheduled (`SCHEDULED • date`) or ongoing (blinking red `LIVE NOW`), linking to the stream. No Google API credentials `scripts/live-status.mjs` (zero deps) reads my channel's public Live tab at build time via `prebuild`, plus the public `/live` redirect as a second signal, and writes `src/data/live-status.json` (committed, do not hand-edit)

`.github/workflows/live-check.yml` re-runs the check every 15 min and pushes a commit only when the status changed, so Cloudflare Pages rebuilds and the indicator stays fresh, the script never fails the build on any error it writes a null status and the pill stays hidden

## Ads (AdSense)

All ad config lives in `src/site.ts`:

1. Set `adsenseClient` publisher ID (`ca-pub-...`)
2. Create responsive display units (AdSense > Ads > By ad unit) and paste the numeric IDs into `adSlots`
3. Set publisher ID in `public/ads.txt` (`pub-...` line)

Until the real IDs are set, nothing ad-related renders previews stay clean, placements are capped for UX (max 2 per page, all labeled, reserved min-height so no layout shift):

- Home: one unit below the post grid
- Blog index: one unit below the grid
- Post: one below the title block, one at end of article

With just `adsenseClient` set and Auto Ads enabled in AdSense dashboard, Google fills placements automatically, the manual units above render once their slot IDs are set

## Deploy free (Cloudflare Pages)

1. Push to GitHub
2. Cloudflare Dashboard -> Workers and Pages -> Create -> Pages -> Connect repo
3. Build: `npm run build`, output: `dist`
4. Done
