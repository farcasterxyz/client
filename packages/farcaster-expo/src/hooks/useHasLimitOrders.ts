import { useLimitOrders } from 'farcaster-client-hooks';

export function useHasLimitOrders({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const { flatData, isSuccess } = useLimitOrders({ enabled });

  return {
    hasLimitOrders: (flatData?.length ?? 0) > 0,
    isSuccess,
  };
}
