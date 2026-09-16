type AnalyticsEventProperties = Record<
  string,
  string | boolean | number | undefined
>;

type AnalyticsUserProperties = {
  username?: string;
  app_version?: string;
  warpcast_version?: string;
};

export type { AnalyticsEventProperties, AnalyticsUserProperties };
