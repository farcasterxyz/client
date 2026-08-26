import * as Updates from 'expo-updates';
import {
  POSTHOG_API_HOST,
  POSTHOG_API_KEY_DEV,
  POSTHOG_API_KEY_PRODUCTION,
} from 'farcaster-analytics';
import { PostHog } from 'posthog-react-native';

import {
  TelemetryProperties,
  TelemetryProvider,
} from '~/analyticsClient/types';

// Use the EAS Updates channel instead of the standard isProd check to determine
// the analytics environment. isProd is based on __DEV__, which is false for all
// EAS builds, sending internal build analytics to the production project.
const analyticsApiKey =
  Updates.channel === 'production'
    ? POSTHOG_API_KEY_PRODUCTION
    : POSTHOG_API_KEY_DEV;

const posthogClient = new PostHog(analyticsApiKey, {
  host: POSTHOG_API_HOST,
  // Session replay is fully disabled. It is already turned off on the PostHog
  // backend, but the client SDK's only hard gate for starting native capture
  // is this flag: when enableSessionReplay is true the native replay thread
  // (PostHogReplayTh) starts regardless of the backend setting, because the
  // SDK defaults recordingActive=true unless a server-side linkedFlag says
  // otherwise. Native CPU profiling showed that thread consuming ~24% of total
  // app CPU during feed scroll (≈ the entire JS thread) — pure overhead with
  // no user benefit. Setting this to false stops the capture thread entirely.
  enableSessionReplay: false,
  // Only autocapture unhandled promise rejections. Uncaught exceptions
  // are NOT autocaptured because useLogErrors (in ~/utils/ErrorUtils.ts)
  // already calls analyticsClient.captureException() in its global error
  // handler. Enabling autocapture would install a second global handler
  // that also calls captureException, creating duplicate events.
  // trackError() also calls captureException for explicitly caught errors.
  errorTracking: {
    autocapture: {
      uncaughtExceptions: false,
      unhandledRejections: true,
    },
  },
});

// Unknown payload (cold-start) returns __DEV__: off in prod so a slow flag
// fetch can't leak telemetry to out-of-cohort users, on in dev so engineers
// don't need to wire up personal flags.
function isFeatureEnabled(key: string) {
  const value = posthogClient.isFeatureEnabled(key);
  if (value === true) return true;
  if (value === false) return false;
  return __DEV__;
}

function toPostHogProperties(properties?: TelemetryProperties) {
  return properties as Parameters<PostHog['capture']>[1];
}

function createPostHogProvider(): TelemetryProvider {
  return {
    isFeatureEnabled,
    capture: (eventName, properties) => {
      posthogClient.capture(eventName, toPostHogProperties(properties));
    },
    captureException: (error, properties) => {
      posthogClient.captureException(error, toPostHogProperties(properties));
    },
    identify: (distinctId, properties) => {
      posthogClient.identify(distinctId, toPostHogProperties(properties));
    },
    alias: (distinctId) => {
      posthogClient.alias(distinctId);
    },
    reset: () => {
      posthogClient.reset();
    },
    setPersonProperties: (properties) => {
      posthogClient.setPersonProperties(
        properties as Parameters<PostHog['setPersonProperties']>[0],
      );
    },
    register: (properties: TelemetryProperties) => {
      void posthogClient.register(toPostHogProperties(properties) ?? {});
    },
    unregister: (key) => {
      void posthogClient.unregister(key);
    },
    getAnonymousId: () => posthogClient.getAnonymousId(),
    getDistinctId: () => posthogClient.getDistinctId(),
    getSessionId: () => posthogClient.getSessionId(),
  };
}

export { createPostHogProvider, posthogClient };
