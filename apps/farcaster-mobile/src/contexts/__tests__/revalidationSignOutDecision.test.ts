import { AnalyticsOnlyEvent } from '../../constants/AnalyticsOnlyEvents';
import { decideRevalidationSignOut } from '../revalidationSignOutDecision';

describe('decideRevalidationSignOut', () => {
  it('treats a cleared transient 401 (valid) as a PREVENTED phantom logout', () => {
    const decision = decideRevalidationSignOut('valid');

    expect(decision.analyticsEvent).toBe(
      AnalyticsOnlyEvent.AuthSignOutPrevented,
    );
    expect(decision.rumAction).toBe('auth_sign_out_prevented');
    expect(decision.signOut).toBe(false);
    // Valid token → clear any stale onboarding-state 401 error view.
    expect(decision.refreshOnboarding).toBe(true);
  });

  it('does NOT count an inconclusive probe as a prevented sign-out', () => {
    // The bug: an inconclusive outcome (network / timeout / offline) used to
    // fall into the same `result !== 'invalid'` branch as 'valid', so it emitted
    // auth.sign_out_prevented and over-counted phantom-logout metrics / RUM
    // actions even though no transient 401 was actually cleared.
    const decision = decideRevalidationSignOut('inconclusive');

    expect(decision.analyticsEvent).not.toBe(
      AnalyticsOnlyEvent.AuthSignOutPrevented,
    );
    expect(decision.rumAction).not.toBe('auth_sign_out_prevented');
    expect(decision.analyticsEvent).toBe(
      AnalyticsOnlyEvent.AuthSignOutInconclusive,
    );
    expect(decision.rumAction).toBe('auth_sign_out_inconclusive');
    // Fail SAFE: an unreachable origin must never sign the user out, and there
    // is no confirmed-valid token to refetch onboarding state for.
    expect(decision.signOut).toBe(false);
    expect(decision.refreshOnboarding).toBe(false);
  });

  it('signs out for a confirmed-revoked token (invalid) as an unexpected logout', () => {
    const decision = decideRevalidationSignOut('invalid');

    expect(decision.analyticsEvent).toBe(
      AnalyticsOnlyEvent.AuthSignOutUnexpected,
    );
    expect(decision.rumAction).toBe('auth_sign_out_unexpected');
    expect(decision.signOut).toBe(true);
    expect(decision.refreshOnboarding).toBe(false);
  });
});
