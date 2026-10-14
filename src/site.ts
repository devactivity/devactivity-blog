// Central site and ads configuration
// TODO: paste AdSense IDs here. Until `adsenseClient` is a real
// `ca-pub-...` ID, no ad scripts or units render (clean preview/build)

export const siteName = 'DevActivity';

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
