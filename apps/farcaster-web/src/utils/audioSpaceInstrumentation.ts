import {
  AudioSpaceCommonContext,
  AudioSpaceEventName,
  shouldEmitAudioSpaceEvent,
} from 'farcaster-client-hooks';

import { Analytics } from '~/utils/analyticsUtils';

type AudioSpaceEventProperties = Record<
  string,
  string | number | boolean | undefined
>;

type TrackWebAudioSpaceEventInput = {
  eventName: AudioSpaceEventName;
  context: AudioSpaceCommonContext;
  properties?: AudioSpaceEventProperties;
  dedupeMap?: Map<string, number>;
  dedupeKey?: string;
  dedupeWindowMs?: number;
};

function getWebWarpcastPlatform() {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const inStandaloneMode =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (typeof window.navigator !== 'undefined' &&
      'standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true);

  return inStandaloneMode ? 'pwa' : 'web';
}

function trackWebAudioSpaceEvent({
  eventName,
  context,
  properties,
  dedupeMap,
  dedupeKey,
  dedupeWindowMs = 1500,
}: TrackWebAudioSpaceEventInput) {
  if (
    dedupeMap &&
    dedupeKey &&
    !shouldEmitAudioSpaceEvent(dedupeMap, dedupeKey, dedupeWindowMs)
  ) {
    return;
  }

  Analytics.logEvent(eventName, {
    ...context,
    ...(properties ?? {}),
    warpcastPlatform: getWebWarpcastPlatform(),
  });
}

export { trackWebAudioSpaceEvent };
