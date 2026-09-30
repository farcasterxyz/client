/**
 * Maps a /v2/me re-validation probe outcome (see maybeSignOutAfterRevalidation
 * in AuthTokenProvider) to the telemetry + sign-out action it should trigger.
 *
 * The three outcomes are deliberately distinct so the phantom-logout metrics
 * stay accurate:
 *
 * - 'valid': a transient/edge 401 the probe cleared — a false-positive logout
 *   was PREVENTED. Emitted as auth.sign_out_prevented and the onboarding-state
 *   query is refetched to clear any stale 401 error view.
 * - 'inconclusive': the probe could not reach the origin (network / timeout /
 *   offline), so revocation was neither confirmed nor cleared. We fail SAFE and
 *   skip the sign-out, but this is NOT a prevented phantom logout — emitting
 *   auth.sign_out_prevented here would over-count that metric, so it gets its
 *   own auth.sign_out_inconclusive event instead.
 * - 'invalid': the token is confirmed revoked — a real, involuntary sign-out.
 *   Emitted as auth.sign_out_unexpected and the session is torn down.
 */

import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';

type RevalidationOutcome = 'valid' | 'invalid' | 'inconclusive';

type RevalidationSignOutDecision = {
  // PostHog analytics event to emit for this outcome.
  analyticsEvent: AnalyticsOnlyEvent;
  // Datadog RUM custom action name to emit for this outcome.
  rumAction: string;
  // Whether the session should be torn down (only for a confirmed revocation).
  signOut: boolean;
  // Whether to refetch onboarding state to clear a stale 401 error view.
  refreshOnboarding: boolean;
};

// Datadog RUM custom action names are snake_case by convention in this codebase
// (e.g. load_provider, initialized_auth_session), while PostHog events use the
// dotted entity.action form (auth.sign_out_prevented). Derive the RUM action
// from the single analyticsEvent source so the two can never drift, without
// breaking either system's naming convention.
function toRumAction(event: AnalyticsOnlyEvent): string {
  return event.replace(/\./g, '_');
}

function decideRevalidationSignOut(
  result: RevalidationOutcome,
): RevalidationSignOutDecision {
  const base = ((): Omit<RevalidationSignOutDecision, 'rumAction'> => {
    switch (result) {
      case 'valid':
        return {
          analyticsEvent: AnalyticsOnlyEvent.AuthSignOutPrevented,
          signOut: false,
          refreshOnboarding: true,
        };
      case 'inconclusive':
        return {
          analyticsEvent: AnalyticsOnlyEvent.AuthSignOutInconclusive,
          signOut: false,
          refreshOnboarding: false,
        };
      case 'invalid':
        return {
          analyticsEvent: AnalyticsOnlyEvent.AuthSignOutUnexpected,
          signOut: true,
          refreshOnboarding: false,
        };
    }
  })();

  return { ...base, rumAction: toRumAction(base.analyticsEvent) };
}

export {
  decideRevalidationSignOut,
  type RevalidationOutcome,
  type RevalidationSignOutDecision,
};
