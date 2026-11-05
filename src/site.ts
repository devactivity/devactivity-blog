// Central site and ads configuration
// TODO: paste AdSense IDs here. Until `adsenseClient` is a real
// `ca-pub-...` ID, no ad scripts or units render (clean preview/build)

export const siteName = 'DevActivity';

// Google Search Console, URL-prefix property, "HTML tag" method: paste only
// the content="..." value of the tag GSC, empty value renders nothing
export const googleSiteVerification = 'ZJ_PzL4ObX-wOgvFPXx0LRWR2zD0agx62YdBSCdpKgI';

// Google Analytics 4: the Measurement ID of the web data stream
// (Admin > Data streams > stream), like 'G-ABC123DEF4', it's public,
// not a secret, empty renders nothing
export const gaMeasurementId = 'G-1QXVKW8RZJ';

// A malformed ID would be interpolated into an inline script, so it fails
// the build loudly instead of shipping a broken tag, the last good deploy
// stays live meanwhile
if (gaMeasurementId && !/^G-[A-Z0-9]{4,}$/.test(gaMeasurementId)) {
  throw new Error(`site.ts: gaMeasurementId "${gaMeasurementId}" must look like G-ABC123DEF4`);
}

export const analyticsConfigured = gaMeasurementId !== '';

// AdSense publisher ID like 'ca-pub-1234567890123456'
export const adsenseClient = 'ca-pub-XXXXXXX';

// Manual responsive display units, create each unit in
// AdSense > Ads > By ad unit, then paste its numeric slot ID
// leave as EMPTY_SLOT to skip that placement (Auto Ads still works
// with just `adsenseClient` set, if enabled in the AdSense dashboard)
const EMPTY_SLOT = '0000000000';

export const adSlots = {
  homeFeed: EMPTY_SLOT,
  blogIndex: EMPTY_SLOT,
  postTop: EMPTY_SLOT,
  postBottom: EMPTY_SLOT,
} as const;

export const adsConfigured = !adsenseClient.includes('XXXX');

export function slotConfigured(slot: string): boolean {
  return adsConfigured && slot !== EMPTY_SLOT;
}
