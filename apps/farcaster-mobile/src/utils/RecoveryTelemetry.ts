/**
 * Normalize email/address for analytics events so FE and BE values match
 * when correlating across the two sides in dashboards.
 */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const normalizeAddress = (address: string): string =>
  address.toLowerCase();

export type RecoveryIntent = 'lost_device' | 'forgot_mnemonic' | 'unknown';

export type RecoveryIntentSignals = {
  hasCachedFid: boolean;
  hasCachedUsername: boolean;
  prefilledEmail: boolean;
};

/**
 * Classify why the user landed on the recovery initiate screen.
 *
 * - `forgot_mnemonic`: the device has prior session state (FID or username
 *   cached, or an email pre-filled from cache) — e.g. user logged out and
 *   forgot their mnemonic.
 * - `lost_device`: no cached signals — likely a fresh install on a new
 *   device after losing the previous one.
 *
 * Note: we deliberately do not use `route.name` as a signal. Within the
 * recovery stack it is always `'RecoveryInitiate'`, so it carries no
 * information about where the user came from. If we want origin-aware
 * classification, the caller should pass an explicit `source` param when
 * navigating (not currently wired).
 */
export const classifyRecoveryIntent = (
  signals: RecoveryIntentSignals,
): RecoveryIntent => {
  const { hasCachedFid, hasCachedUsername, prefilledEmail } = signals;

  if (hasCachedFid || hasCachedUsername || prefilledEmail) {
    return 'forgot_mnemonic';
  }

  return 'lost_device';
};
