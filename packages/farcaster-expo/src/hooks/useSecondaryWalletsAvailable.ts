import { useIsAdmin } from './useIsAdmin';
import { useSecondaryWalletsEnabled } from './useSecondaryWalletsEnabled';
import { useCurrentUserLevel } from './useUserLevel';

/**
 * Gate for the secondary ("private") embedded-wallet feature.
 *
 * Combines two independent signals so non-Pro users never see the feature
 * even if the PostHog flag is later widened to a broader cohort:
 *
 *   1. `secondary-wallets` PostHog flag — the cohort-level on/off knob
 *      (today restricted to the `neynar team` cohort).
 *   2. Account level is `'pro'` — read from the app's own user state, since
 *      PostHog does not have a `level` person property to filter on.
 *
 * Internal team members (`ADMIN_FIDS`) pass even if their account isn't
 * tagged Pro server-side, so internal testing stays unblocked.
 */
export function useSecondaryWalletsAvailable() {
  const flagEnabled = useSecondaryWalletsEnabled();
  const isPro = useCurrentUserLevel() === 'pro';
  const isAdmin = useIsAdmin();
  return flagEnabled && (isPro || isAdmin);
}
