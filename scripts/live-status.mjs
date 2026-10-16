// Checks DevActivity's YouTube Live tab for ongoing/scheduled streams
// called via `npm run prebuild` and by the `live-check` GitHub Actions cron
// never throws on any failure it writes, a null status so the site builds with the indicator hidden
//
// No Google API credentials are used, it queries YouTube's own public web client
// (the same endpoint every browser hits, similar like what yt-dlp uses) also the
// public `/live` redirect, which only resolves to a watch URL while live
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANNEL_ID = 'UCyAnKNcVOr6SWJGIlHh6TMQ';
// YouTube's own public web-client key (not a secret :p)
const WEB_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const OUT = fileURLToPath(new URL('../src/data/live-status.json', import.meta.url));

// NOTE: change this if not working
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FALLBACK_CLIENT_VERSION = '2.20261012.01.00';

async function innertubeBrowse(browseId, params, clientVersion) {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/browse?key=${WEB_KEY}&prettyPrint=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } },
        browseId,
        ...(params ? { params } : {}),
      }),
    },
  );
  if (!res.ok) throw new Error(`browse HTTP ${res.status}`);
  return res.json();
}

async function detectClientVersion() {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/live`, {
      headers: { 'User-Agent': UA },
    });
    const html = await res.text();
    const m =
      html.match(/client\.version":"([^"]+)"/) || html.match(/"clientVersion":"([^"]+)"/);
    if (m) return m[1];
  } catch {
    // fall through to pinned version
  }
  return FALLBACK_CLIENT_VERSION;
}

// independent "ongoing live" signal, /live 302s to watch?v=... only while live
async function liveRedirectVideoId() {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/live`, {
      redirect: 'manual',
      headers: { 'User-Agent': UA },
    });
    const loc = res.headers.get('location') || '';
    const m = loc.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function videoIdFromLockup(lm) {
  if (typeof lm?.contentId === 'string' && /^[\w-]{11}$/.test(lm.contentId)) return lm.contentId;
  const blob = JSON.stringify(lm);
  let m = blob.match(/"watchEndpoint":\{"videoId":"([\w-]{11})"/);
  if (m) return m[1];
  m = blob.match(/\/vi\/([\w-]{11})\//);
  return m ? m[1] : null;
}

function badgeTexts(lm) {
  const blob = JSON.stringify(lm);
  const texts = new Set();
  for (const m of blob.matchAll(/"text":"([^"]{1,60})"/g)) {
    const t = m[1];
    if (/^(live|upcoming|premiere|scheduled|now playing)/i.test(t) || /schedul/i.test(t)) {
      texts.add(t);
    }
  }
  for (const m of blob.matchAll(/"label":"([^"]{1,60})"/g)) {
    if (/live|upcoming|premiere/i.test(m[1])) texts.add(m[1]);
  }
  return [...texts];
}

function startTimeFrom(lm) {
  const blob = JSON.stringify(lm);
  let m = blob.match(/"startTime":"(\d{9,})"/);
  if (m) return Number(m[1]);
  m = blob.match(/"scheduledStartTime":"?(\d{9,})"?/);
  return m ? Number(m[1]) : null;
}

function extractLiveTabItems(liveJson) {
  const tabs = liveJson?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
  const liveTab = tabs
    .map((t) => t?.tabRenderer)
    .find((t) => t && (t.selected || t.title === 'Live'));
  const items = liveTab?.content?.richGridRenderer?.contents ?? [];
  const out = [];
  for (const it of items) {
    const lm = it?.richItemRenderer?.content?.lockupViewModel;
    if (!lm) continue;
    const videoId = videoIdFromLockup(lm);
    if (!videoId) continue;
    const title =
      lm?.metadata?.lockupMetadataViewModel?.title?.content ||
      lm?.metadata?.lockupMetadataViewModel?.title ||
      '';
    out.push({ videoId, title: String(title).slice(0, 120), badges: badgeTexts(lm), startTime: startTimeFrom(lm) });
  }
  return out;
}

async function main() {
  const status = { checkedAt: new Date().toISOString(), channelId: CHANNEL_ID, live: null, upcoming: null };
  try {
    const [clientVersion, redirectVid] = await Promise.all([
      detectClientVersion(),
      liveRedirectVideoId(),
    ]);
    const home = await innertubeBrowse(CHANNEL_ID, undefined, clientVersion);
    const tabs = home?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const liveParams = tabs
      .map((t) => t?.tabRenderer)
      .find((t) => t?.title === 'Live')?.endpoint?.browseEndpoint?.params;
    if (!liveParams) throw new Error('Live tab params not found');
    const liveJson = await innertubeBrowse(CHANNEL_ID, liveParams, clientVersion);
    const items = extractLiveTabItems(liveJson);

    const liveItem =
      items.find((i) => i.badges.some((b) => b.toLowerCase() === 'live')) ??
      (redirectVid ? items.find((i) => i.videoId === redirectVid) ?? null : null);

    if (liveItem) {
      status.live = {
        videoId: liveItem.videoId,
        title: liveItem.title,
        url: `https://www.youtube.com/watch?v=${liveItem.videoId}`,
      };
    } else {
      const upcoming = items
        .filter(
          (i) =>
            i.startTime || i.badges.some((b) => /schedul|upcoming|premiere/i.test(b)),
        )
        .sort((a, b) => (a.startTime ?? Infinity) - (b.startTime ?? Infinity))[0];
      if (upcoming) {
        status.upcoming = {
          videoId: upcoming.videoId,
          title: upcoming.title,
          url: `https://www.youtube.com/watch?v=${upcoming.videoId}`,
          ...(upcoming.startTime ? { startTime: upcoming.startTime } : {}),
        };
      }
    }
    console.log(
      `live-status: live=${status.live?.videoId ?? 'none'} upcoming=${status.upcoming?.videoId ?? 'none'}`,
    );
  } catch (err) {
    console.warn(`live-status: check failed (${err.message}), writing null status`);
    status.error = String(err.message).slice(0, 200);
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(status, null, 2) + '\n');
}

await main();
