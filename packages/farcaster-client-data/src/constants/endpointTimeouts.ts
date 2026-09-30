// These values are based on P99 resource duration for these endpoints on
// most used devices as seen on DataDog.

// Using these values as timeout instead of the global default will help reduce
// the request load on poor connectivity situations.

export const DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION = 10_000;
export const DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_MESSAGES = 10_000;
export const DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_RECENT_MESSAGES = 10_000;
export const DEFAULT_TIMEOUT_DIRECT_CAST_INBOX = 5_000;
// Client config is a small, latency-critical boot endpoint that gates the
// first render. The global 20s read timeout makes a flaky-network boot sit on
// the splash for tens of seconds; an 8s cap surfaces the retry UI quickly
// while staying well above the endpoint's P99.
export const DEFAULT_TIMEOUT_CLIENT_CONFIG = 8_000;
export const DEFAULT_TIMEOUT_FEED_ITEMS = 5_000;
export const DEFAULT_TIMEOUT_NOTIFICATIONS_FOR_TAB = 10_000;
export const DEFAULT_TIMEOUT_ONBOARDING_STATE = 10_000;
export const DEFAULT_TIMEOUT_UNSEEN = 5_000;
