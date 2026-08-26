import { QueryKey } from '@tanstack/react-query';
import { useRefreshInfiniteFirstPageOnly } from 'farcaster-client-hooks';

import { usePullToRefreshInfinite } from './usePullToRefreshInfinite';

const usePullToRefreshInfiniteFirstPageOnly = <T>(
  queryKey: QueryKey,
  refetch: () => Promise<unknown>,
  offset: number | undefined = undefined,
) => {
  return usePullToRefreshInfinite({
    refetch: useRefreshInfiniteFirstPageOnly<T>(queryKey, refetch),
    offset,
  });
};

export { usePullToRefreshInfiniteFirstPageOnly };
