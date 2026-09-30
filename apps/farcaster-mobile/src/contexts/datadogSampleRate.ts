import { posthogClient } from '~/analyticsClient/providers/posthogProvider';
import { trackError } from '~/utils/ErrorUtils';
import { getStorage } from '~/utils/FastStorageUtils';

type RumSamplingConfig = {
  sessionSampleRate: number;
  resourceTraceSampleRate: number;
};

// Used when no valid cached config is available — fresh install, app
// data cleared, corrupted cache, etc. 0/0 keeps "no signal" cleanly
// "no data" rather than a thin trickle that would dilute the
// configured cohort rates.
const FALLBACK_CONFIG: RumSamplingConfig = {
  sessionSampleRate: 0,
  resourceTraceSampleRate: 0,
};

const SAMPLE_RATE_FLAG = 'datadog-rum-sample-rate';
const MMKV_CACHE_KEY = 'datadog-rum-sampling-config';

function isValidRate(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function parsePayload(payload: unknown): RumSamplingConfig | null {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const obj = payload as Record<string, unknown>;
  if (
    !isValidRate(obj.sessionSampleRate) ||
    !isValidRate(obj.resourceTraceSampleRate)
  ) {
    return null;
  }
  return {
    sessionSampleRate: obj.sessionSampleRate,
    resourceTraceSampleRate: obj.resourceTraceSampleRate,
  };
}

function readCachedConfig(): RumSamplingConfig | null {
  try {
    const raw = getStorage().getString(MMKV_CACHE_KEY);
    if (!raw) return null;
    return parsePayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCachedConfig(config: RumSamplingConfig): void {
  try {
    getStorage().set(MMKV_CACHE_KEY, JSON.stringify(config));
  } catch (err) {
    trackError(err, { location: 'DatadogProvider.writeCachedConfig' });
  }
}

function clearCachedConfig(): void {
  try {
    getStorage().delete(MMKV_CACHE_KEY);
  } catch (err) {
    trackError(err, { location: 'DatadogProvider.clearCachedConfig' });
  }
}

function refreshConfigCacheFromPostHog(): void {
  // Check whether the flag is explicitly disabled (kill switch). Distinct
  // from "PostHog not loaded yet" — both make the payload undefined, but
  // a `false` here is the operator saying "stop reporting". When that
  // happens, drop the cached value so the next cold start falls through
  // to FALLBACK_CONFIG (0/0).
  let enabled: boolean | undefined;
  try {
    enabled = posthogClient.isFeatureEnabled(SAMPLE_RATE_FLAG);
  } catch (err) {
    trackError(err, {
      location: 'DatadogProvider.refreshConfigCacheFromPostHog',
      reason: 'posthog-isFeatureEnabled-threw',
    });
    return;
  }

  if (enabled === false) {
    clearCachedConfig();
    return;
  }

  if (enabled !== true) {
    return;
  }

  let payload: unknown;
  try {
    payload = posthogClient.getFeatureFlagPayload(SAMPLE_RATE_FLAG);
  } catch (err) {
    trackError(err, {
      location: 'DatadogProvider.refreshConfigCacheFromPostHog',
      reason: 'posthog-getFeatureFlagPayload-threw',
    });
    return;
  }

  if (payload === undefined) {
    return;
  }

  const parsed = parsePayload(payload);
  if (!parsed) {
    trackError(new Error('Invalid datadog-rum-sample-rate payload'), {
      location: 'DatadogProvider.refreshConfigCacheFromPostHog',
      payload: JSON.stringify(payload).slice(0, 128),
    });
    return;
  }

  writeCachedConfig(parsed);
}

function resolveRumSamplingConfig(): RumSamplingConfig {
  // Subscribe to PostHog flag updates to keep the MMKV cache fresh for
  // the next cold start. Fires once PostHog has loaded flags from its
  // own storage, plus again after each refetch. Doesn't affect this
  // session (Datadog's sample rate is locked in at SDK init), but
  // ensures the next cold start has an up-to-date cached value.
  try {
    posthogClient.onFeatureFlags(() => {
      refreshConfigCacheFromPostHog();
    });
  } catch (err) {
    trackError(err, {
      location: 'DatadogProvider.resolveRumSamplingConfig',
      reason: 'posthog-onFeatureFlags-subscribe-threw',
    });
  }

  // Synchronous read from MMKV — fast and ready at module load. PostHog
  // can't give us a synchronous value at this point in app boot.
  return readCachedConfig() ?? FALLBACK_CONFIG;
}

export { FALLBACK_CONFIG, parsePayload, resolveRumSamplingConfig };
export type { RumSamplingConfig };
