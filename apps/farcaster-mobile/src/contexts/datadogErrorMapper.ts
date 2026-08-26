// Pure predicates for the Datadog RUM `errorEventMapper` / `logEventMapper`.
// Extracted from DatadogProvider so they can be unit-tested without pulling
// in the native Datadog SDK (mirrors datadogSampleRate.ts).

const PRIVY_PING_TIMEOUT_PREFIX = 'Ping reached timeout';
// Privy emits this error frequently; not actionable, so drop on the
// floor before it pollutes RUM. `includes` rather than `startsWith`
// catches prefixed variants like `[Privy] Ping reached timeout`.
function isPrivyPingTimeout(message: string): boolean {
  return message.includes(PRIVY_PING_TIMEOUT_PREFIX);
}

// Drop iOS request cancellations (NSURLErrorDomain Code=-999, "cancelled":
// a view unmounted mid-flight, or React Query aborted a superseded request).
// Benign and the largest source of RUM error noise; only the error event is
// dropped — the request is still recorded as a resource. Match the stable
// code, not the localized message: real failures use other codes (-1001
// timeout, -1009 offline, …) and still surface.
const NSURL_CANCELLED_CODE = 'NSURLErrorDomain Code=-999';
function isCancelledRequest(error: { stacktrace?: string }): boolean {
  return (error.stacktrace ?? '').includes(NSURL_CANCELLED_CODE);
}

export { isCancelledRequest, isPrivyPingTimeout };
