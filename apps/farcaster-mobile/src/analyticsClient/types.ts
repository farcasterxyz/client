type TelemetryProperties = Record<string, unknown>;

type AnalyticsIdentity = {
  fid: number | string;
  username?: string;
} & TelemetryProperties;

type AnalyticsEnvelope = {
  fid?: number | string;
  username?: string;
  deviceId?: string;
  appSessionId?: string;
  appBuild?: string | null;
  appVersion?: string | null;
  runtimeVersion?: string | null;
  releaseChannel?: string | null;
  updateId?: string | null;
  updates_id?: string | null;
  platform?: string;
  osVersion?: string | null;
  deviceModel?: string | null;
  jsEngine?: string;
  batteryLevel?: number;
  jsHeapUsedMB?: number;
  networkType?: string;
  currentRoute?: string;
  $screen_name?: string;
};

type TelemetryProvider = {
  isFeatureEnabled?: (key: string) => boolean;
  capture: (eventName: string, properties?: TelemetryProperties) => void;
  captureException: (error: unknown, properties?: TelemetryProperties) => void;
  identify: (distinctId?: string, properties?: TelemetryProperties) => void;
  alias: (distinctId: string) => void;
  reset: () => void;
  setPersonProperties: (properties: TelemetryProperties) => void;
  register: (properties: TelemetryProperties) => void;
  unregister: (key: string) => void;
  getAnonymousId: () => string | undefined;
  getDistinctId: () => string | undefined;
  getSessionId: () => string | undefined;
};

export type {
  AnalyticsEnvelope,
  AnalyticsIdentity,
  TelemetryProperties,
  TelemetryProvider,
};
