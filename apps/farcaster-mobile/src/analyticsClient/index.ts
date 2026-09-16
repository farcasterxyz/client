import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { compactProperties } from './compactProperties';
import { createPostHogProvider } from './providers/posthogProvider';
import {
  AnalyticsEnvelope,
  AnalyticsIdentity,
  TelemetryProperties,
  TelemetryProvider,
} from './types';

const MOBILE_TELEMETRY_FEATURE_FLAG = 'mobile-telemetry-v1';

function getJsEngine() {
  const globalWithHermes = globalThis as typeof globalThis & {
    HermesInternal?: unknown;
  };

  return globalWithHermes.HermesInternal ? 'hermes' : 'jsc';
}

// Returns undefined on JSC and on Hermes builds without getInstrumentedStats.
function readJsHeapUsedMB(): number | undefined {
  const hermes = (
    globalThis as {
      HermesInternal?: {
        getInstrumentedStats?: () => { js_allocatedBytes?: number };
      };
    }
  ).HermesInternal;
  const bytes = hermes?.getInstrumentedStats?.().js_allocatedBytes;
  return typeof bytes === 'number' ? Math.round(bytes / 1_048_576) : undefined;
}

class AnalyticsClient {
  private providers: TelemetryProvider[] = [];
  private envelope: AnalyticsEnvelope = {};

  constructor(providers: TelemetryProvider[]) {
    this.providers = providers;
  }

  capture(eventName: string, properties: TelemetryProperties = {}) {
    const eventProperties = this.withEnvelope(properties);

    this.providers.forEach((provider) => {
      provider.capture(eventName, eventProperties);
    });
  }

  // Kill-switch-gated. Use for sampler output so the flag can silence the
  // telemetry stream without affecting product analytics or identity events.
  captureTelemetry(eventName: string, properties: TelemetryProperties = {}) {
    if (!this.isTelemetryEnabled()) {
      return;
    }

    const eventProperties = this.withEnvelope(properties);

    this.providers.forEach((provider) => {
      provider.capture(eventName, eventProperties);
    });
  }

  captureException(error: unknown, properties: TelemetryProperties = {}) {
    const eventProperties = this.withEnvelope(properties);

    this.providers.forEach((provider) => {
      provider.captureException(error, eventProperties);
    });
  }

  identify(identity: AnalyticsIdentity): void;
  identify(distinctId: string, properties?: TelemetryProperties): void;
  identify(
    distinctIdOrIdentity?: string | AnalyticsIdentity,
    properties: TelemetryProperties = {},
  ) {
    if (typeof distinctIdOrIdentity === 'object') {
      this.identifyUser(distinctIdOrIdentity);
      return;
    }

    this.providers.forEach((provider) => {
      provider.identify(distinctIdOrIdentity, properties);
    });
  }

  alias(distinctId: string) {
    this.providers.forEach((provider) => {
      provider.alias(distinctId);
    });
  }

  reset() {
    this.envelope = {
      ...this.envelope,
      fid: undefined,
      username: undefined,
    };

    this.providers.forEach((provider) => {
      provider.reset();
    });
  }

  setPersonProperties(properties: TelemetryProperties) {
    this.providers.forEach((provider) => {
      provider.setPersonProperties(properties);
    });
  }

  register(properties: TelemetryProperties) {
    this.providers.forEach((provider) => {
      provider.register(properties);
    });
  }

  unregister(key: string) {
    this.providers.forEach((provider) => {
      provider.unregister(key);
    });
  }

  getAnonymousId() {
    return this.providers[0]?.getAnonymousId();
  }

  getDistinctId() {
    return this.providers[0]?.getDistinctId();
  }

  getSessionId() {
    return this.providers[0]?.getSessionId();
  }

  setEnvelopeContext(nextEnvelope: Partial<AnalyticsEnvelope>) {
    this.envelope = {
      ...this.envelope,
      ...nextEnvelope,
    };
  }

  private identifyUser(identity: AnalyticsIdentity) {
    const distinctId = String(identity.fid);
    const { fid, username, ...additionalProperties } = identity;
    const personProperties = compactProperties({
      ...additionalProperties,
      fid,
      username,
    });

    this.setEnvelopeContext({
      fid,
      username,
    });

    this.providers.forEach((provider) => {
      const currentDistinctId = provider.getDistinctId();
      const anonymousId = provider.getAnonymousId();

      // Only alias when the current id is still the anonymous device id.
      // Aliasing from one identified user to another permanently merges
      // their PostHog person profiles, sessions, and replays.
      const isAnonymous =
        currentDistinctId !== undefined && currentDistinctId === anonymousId;

      if (isAnonymous && currentDistinctId !== distinctId) {
        provider.alias(distinctId);
      }

      provider.identify(distinctId, personProperties);
    });
  }

  private isTelemetryEnabled() {
    return this.providers.every((provider) => {
      return (
        provider.isFeatureEnabled?.(MOBILE_TELEMETRY_FEATURE_FLAG) !== false
      );
    });
  }

  private withEnvelope(properties: TelemetryProperties) {
    try {
      return {
        ...this.buildEnvelope(),
        ...properties,
      };
    } catch {
      return properties;
    }
  }

  private buildEnvelope() {
    return compactProperties({
      appBuild: Application.nativeBuildVersion,
      appVersion: Application.nativeApplicationVersion,
      runtimeVersion: Updates.runtimeVersion,
      releaseChannel: Updates.channel,
      updateId: Updates.updateId,
      updates_id: Updates.updateId,
      platform: Platform.OS,
      osVersion: Device.osVersion,
      deviceModel: Device.modelName,
      jsEngine: getJsEngine(),
      jsHeapUsedMB: readJsHeapUsedMB(),
      ...this.envelope,
    });
  }
}

const analyticsClient = new AnalyticsClient([createPostHogProvider()]);

export { analyticsClient };
export type { AnalyticsIdentity, TelemetryProperties };
