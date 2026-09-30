import { NetworkMode } from '@tanstack/react-query';

// Mirror the backend's LocalCache TTL (WalletLinksService CACHE_TTL_SECONDS =
// 5 min). Any admin write (create/update/delete) busts the backend cache, so
// worst-case latency for an admin edit to surface on-device is ~5 min. A
// longer client staleTime made admin-driven sortOrder changes (NEYN-11997)
// invisible to already-warm clients for up to an hour.
const walletLinksDefaultQueryOptions = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  networkMode: 'offlineFirst' as NetworkMode,
  // Non-critical UI; skip the default 3-retry storm on transient failures
  // (including the /v2/defi-links → /v2/wallet-links rollout window).
  retry: 1,
};

export { walletLinksDefaultQueryOptions };
