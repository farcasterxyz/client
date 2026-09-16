import { useHasLimitOrders } from './useHasLimitOrders';
import { useLimitOrdersEnabled } from './useLimitOrdersEnabled';

export function useShowWalletOrdersTab() {
  const limitOrdersEnabled = useLimitOrdersEnabled();
  const { hasLimitOrders, isSuccess } = useHasLimitOrders({
    enabled: !limitOrdersEnabled,
  });

  // Flagged-in users keep the always-on Orders tab with no extra fetch.
  // When the flag is off, only show the tab after confirming the user has
  // existing orders to manage — never while loading or without access.
  const showWalletOrdersTab =
    limitOrdersEnabled || (isSuccess && hasLimitOrders);

  return {
    showWalletOrdersTab,
  };
}
