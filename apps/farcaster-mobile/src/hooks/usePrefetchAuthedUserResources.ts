import { usePrefetchUserPreferences } from 'farcaster-client-hooks';
import { useCallback } from 'react';

/**
 * Prefetches all authed user resources. Must be called after onboarding state
 * has been fetched.
 */
const usePrefetchAuthedUserResources = () => {
  const prefetchUserPreferences = usePrefetchUserPreferences();

  return useCallback(async () => {
    await Promise.all([prefetchUserPreferences()]);
  }, [prefetchUserPreferences]);
};

export { usePrefetchAuthedUserResources };
