import posthog from 'posthog-js';

import { posthogApiHost, posthogApiKey } from '~/constants/analytics';

type EventProperties = Record<string, unknown> | undefined;
type FeatureFlagsCallback = Parameters<typeof posthog.onFeatureFlags>[0];

let disabled = false;
let posthogInitialized = false;
let hasUserId = false;

const Analytics = {
  init: (): void => {
    if (!disabled) {
      Analytics.enable();
    }
  },

  enable: (): void => {
    disabled = false;

    if (!posthogInitialized) {
      posthog.init(posthogApiKey, {
        api_host: posthogApiHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage',
      });
      posthogInitialized = true;
    } else {
      posthog.opt_in_capturing();
    }
  },

  disable: (): void => {
    disabled = true;
    if (posthogInitialized) {
      posthog.opt_out_capturing();
    }
  },

  logEvent: (event: string, data?: EventProperties): void => {
    if (!disabled && hasUserId && posthogInitialized) {
      posthog.capture(event, data);
    }
  },

  logAnalyticsOnlyEvent: (event: string, data?: EventProperties): void => {
    if (!disabled && hasUserId && posthogInitialized) {
      posthog.capture(event, data);
    }
  },

  // We are allowing this as we have some specific flows where we really want
  // to analyze and the event count should be really low.
  dangerouslyLogPossiblyPreAuthEvent: (
    event: string,
    data?: EventProperties,
  ): void => {
    if (!disabled && posthogInitialized) {
      posthog.capture(event, data);
    }
  },

  setUserId: (userId: string | null): void => {
    if (!disabled) {
      hasUserId = userId !== null;

      if (posthogInitialized) {
        if (userId) {
          posthog.identify(userId);
        } else {
          posthog.reset();
        }
      }
    }
  },

  setUserProperties: ({
    username,
    neynarScore,
    version,
    appVersion,
  }: {
    username: string | undefined;
    neynarScore?: number;
    version: string;
    appVersion: string;
  }): void => {
    if (!disabled && posthogInitialized) {
      posthog.setPersonProperties({
        username,
        neynar_score: neynarScore,
        app_version: appVersion,
        warpcast_version: version,
        ...(typeof neynarScore === 'number'
          ? { neynar_score: neynarScore }
          : {}),
      });
    }
  },

  getDeviceId: (): string | undefined => {
    if (!posthogInitialized) {
      return undefined;
    }
    return posthog.get_property('$device_id') as string | undefined;
  },

  getSessionId: (): string | undefined => {
    if (!posthogInitialized) {
      return undefined;
    }
    return posthog.get_session_id();
  },

  isFeatureEnabled: (key: string): boolean | undefined => {
    if (!posthogInitialized) {
      return undefined;
    }
    return posthog.isFeatureEnabled(key);
  },

  getFeatureFlagPayload: (key: string): unknown => {
    if (!posthogInitialized) {
      return undefined;
    }
    return posthog.getFeatureFlagPayload(key);
  },

  onFeatureFlags: (callback: FeatureFlagsCallback): (() => void) => {
    if (!posthogInitialized) {
      return () => {};
    }
    return posthog.onFeatureFlags(callback);
  },
};

Object.freeze(Analytics);
export { Analytics };
