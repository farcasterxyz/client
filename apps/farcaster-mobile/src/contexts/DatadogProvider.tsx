import { DdSdkReactNative } from '@datadog/mobile-react-native';
import * as Application from 'expo-application';
import {
  BatchSize,
  DatadogProvider,
  DatadogProviderConfiguration,
  DdRum,
  ErrorSource,
  PropagatorType,
  RumActionType,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
} from 'expo-datadog';
import * as Updates from 'expo-updates';
import { TelemetryProvider } from 'farcaster-client-hooks';
import React, { PropsWithChildren } from 'react';

import { isDev } from '~/constants/Env';
import { trackError } from '~/utils/ErrorUtils';

import { isCancelledRequest, isPrivyPingTimeout } from './datadogErrorMapper';
import { resolveRumSamplingConfig } from './datadogSampleRate';

const DEV_SAMPLING_CONFIG = {
  sessionSampleRate: 100,
  resourceTraceSampleRate: 100,
};

const DATADOG_CLIENT_TOKEN = 'REPLACE_ME';
const DATADOG_APPLICATION_ID = 'REPLACE_ME';

// Use Updates.channel so internal EAS builds report as a separate Datadog
// environment and don't pollute the prod RUM cohort.
function resolveDatadogEnvironment(): string {
  if (isDev) return 'dev';
  if (Updates.channel === 'production') return 'prod';
  return Updates.channel || 'unknown';
}

const datadogConfiguration = new DatadogProviderConfiguration(
  DATADOG_CLIENT_TOKEN,
  resolveDatadogEnvironment(),
  // In dev we still init the SDK so direct DdRum.* call sites in
  // providers/screens don't crash on an uninitialized native module, but
  // we set consent to NOT_GRANTED so nothing is actually uploaded to
  // Datadog from developer machines.
  isDev ? TrackingConsent.NOT_GRANTED : TrackingConsent.GRANTED,
  {
    site: 'US1',
    service: 'farcaster-mobile',
    verbosity: SdkVerbosity.WARN,
    versionSuffix: Application.nativeBuildVersion ?? undefined,
    rumConfiguration: {
      applicationId: DATADOG_APPLICATION_ID,
      trackInteractions: true,
      trackResources: true,
      trackErrors: true,
      trackFrustrations: true,
      trackBackgroundEvents: true,
      nativeCrashReportEnabled: true,
      trackNonFatalAnrs: true,
      trackWatchdogTerminations: true,
      longTaskThresholdMs: 300,
      ...(isDev ? DEV_SAMPLING_CONFIG : resolveRumSamplingConfig()),
      firstPartyHosts: [
        {
          match: 'client.farcaster.xyz',
          // Backend's tracer is Datadog-native; TRACECONTEXT is a fallback
          // for standards-only middleware.
          propagatorTypes: [
            PropagatorType.DATADOG,
            PropagatorType.TRACECONTEXT,
          ],
        },
      ],
      errorEventMapper: (error) =>
        isPrivyPingTimeout(error.message) || isCancelledRequest(error)
          ? null
          : error,
    },
    logsConfiguration: {
      logEventMapper: (log) => (isPrivyPingTimeout(log.message) ? null : log),
    },
    traceConfiguration: {},
    ...(isDev && {
      uploadFrequency: UploadFrequency.FREQUENT,
      batchSize: BatchSize.SMALL,
    }),
  },
);

// DdRum.* methods are async and buffer calls before the SDK is initialized
// (see bufferVoidNativeCall in @datadog/mobile-react-native). They never
// throw synchronously, so the consumer-facing wrappers don't need a
// defensive try/catch — sync errors here would be real programmer bugs
// worth surfacing.
const telemetryMethods = {
  startAction: (name: string, context?: object, timestampMs?: number) => {
    DdRum.startAction(RumActionType.CUSTOM, name, context, timestampMs);
  },
  stopAction: (name: string, context?: object, timestampMs?: number) => {
    DdRum.stopAction(RumActionType.CUSTOM, name, context, timestampMs);
  },
  addAction: (name: string, context?: object, timestampMs?: number) => {
    DdRum.addAction(RumActionType.CUSTOM, name, context, timestampMs);
  },
  addError: (
    message: string,
    stacktrace: string,
    context?: object,
    timestampMs?: number,
    fingerprint?: string,
  ) => {
    DdRum.addError(
      message,
      ErrorSource.CUSTOM,
      stacktrace,
      context,
      timestampMs,
      fingerprint,
    );
  },
};

// Attach the OTA update identity as global RUM attributes so every event
// (including pre-auth ones like ApplicationLaunch) can be filtered by the
// JS bundle that produced it. These complement the version tag (which
// covers app version + native build number) with the third critical
// dimension: which OTA update is loaded. Available in Datadog as
// @otaId, @runtimeVersion.
// `channel` is intentionally omitted — it's already exposed via the `env`
// tag (see resolveDatadogEnvironment) and doesn't change at runtime.
function attachOtaContext() {
  const attrs: Record<string, unknown> = {};
  if (Updates.updateId) attrs.otaId = Updates.updateId;
  if (Updates.runtimeVersion) attrs.runtimeVersion = Updates.runtimeVersion;
  DdSdkReactNative.addAttributes(attrs);
}

// Local boundary so SDK init failures degrade to "RUM disabled" instead
// of taking down the whole app via the root ErrorBoundary that lives
// further down the tree.
class DatadogInitErrorBoundary extends React.Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    trackError(error, { location: 'DatadogInitErrorBoundary' });
  }

  render() {
    if (this.state.failed) {
      return <TelemetryProvider>{this.props.children}</TelemetryProvider>;
    }
    return this.props.children;
  }
}

function WrappedDatadogProvider({ children }: PropsWithChildren) {
  return (
    <DatadogInitErrorBoundary>
      <DatadogProvider
        configuration={datadogConfiguration}
        onInitialization={attachOtaContext}
      >
        <TelemetryProvider methods={telemetryMethods}>
          {children}
        </TelemetryProvider>
      </DatadogProvider>
    </DatadogInitErrorBoundary>
  );
}

export { WrappedDatadogProvider };
