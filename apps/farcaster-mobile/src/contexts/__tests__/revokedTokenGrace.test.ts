import {
  createRevokedTokenGraceGuard,
  FRESH_TOKEN_GRACE_MS,
  RESTORED_TOKEN_GRACE_MS,
} from '../revokedTokenGrace';

describe('createRevokedTokenGraceGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const revoked401 = ({
    hasRestoredPersistedAuthToken,
  }: {
    hasRestoredPersistedAuthToken: boolean;
  }) => ({
    responseStatus: 401,
    endpointName: 'onboardingState',
    hasRestoredPersistedAuthToken,
  });

  it('does NOT sign out on an immediate transient 401 after a cold-start persisted-token restore', () => {
    // The force-quit/relaunch bug: the restored-token path used to bypass the
    // grace period entirely, so a single transient 401 right after relaunch
    // signed the user out instantly.
    const guard = createRevokedTokenGraceGuard();

    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: true })),
    ).toBe(false);

    guard.dispose();
  });

  it('still keeps a 401 suppressed on the restored path just before its grace elapses', () => {
    const guard = createRevokedTokenGraceGuard();

    jest.advanceTimersByTime(RESTORED_TOKEN_GRACE_MS - 1);
    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: true })),
    ).toBe(false);

    guard.dispose();
  });

  it('signs out for a 401 on the restored path once the restored grace elapses (revoked persisted token)', () => {
    const guard = createRevokedTokenGraceGuard();

    jest.advanceTimersByTime(RESTORED_TOKEN_GRACE_MS);
    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: true })),
    ).toBe(true);

    guard.dispose();
  });

  it('gives the fresh-token path the full grace window — restored arming alone does not affect it', () => {
    const guard = createRevokedTokenGraceGuard();

    jest.advanceTimersByTime(RESTORED_TOKEN_GRACE_MS);
    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: false })),
    ).toBe(false);

    jest.advanceTimersByTime(FRESH_TOKEN_GRACE_MS - RESTORED_TOKEN_GRACE_MS);
    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: false })),
    ).toBe(true);

    guard.dispose();
  });

  it('never signs out for the deleteAuthToken endpoint (would loop inside signOut)', () => {
    const guard = createRevokedTokenGraceGuard();

    jest.advanceTimersByTime(FRESH_TOKEN_GRACE_MS);
    expect(
      guard.shouldSignOut({
        responseStatus: 401,
        endpointName: 'deleteAuthToken',
        hasRestoredPersistedAuthToken: true,
      }),
    ).toBe(false);

    guard.dispose();
  });

  it('ignores non-401 responses, including undefined status (network errors)', () => {
    const guard = createRevokedTokenGraceGuard();

    jest.advanceTimersByTime(FRESH_TOKEN_GRACE_MS);
    expect(
      guard.shouldSignOut({
        responseStatus: 500,
        endpointName: 'onboardingState',
        hasRestoredPersistedAuthToken: true,
      }),
    ).toBe(false);
    expect(
      guard.shouldSignOut({
        responseStatus: undefined,
        endpointName: 'onboardingState',
        hasRestoredPersistedAuthToken: true,
      }),
    ).toBe(false);

    guard.dispose();
  });

  it('dispose() cancels arming — no sign-out even after both windows would have elapsed', () => {
    const guard = createRevokedTokenGraceGuard();

    guard.dispose();
    jest.advanceTimersByTime(FRESH_TOKEN_GRACE_MS * 2);
    expect(
      guard.shouldSignOut(revoked401({ hasRestoredPersistedAuthToken: true })),
    ).toBe(false);
  });
});
