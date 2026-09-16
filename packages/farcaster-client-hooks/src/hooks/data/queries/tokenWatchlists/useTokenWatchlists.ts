import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildTokenWatchlistsFetcher } from './buildTokenWatchlistsFetcher';
import { buildTokenWatchlistsKey } from './buildTokenWatchlistsKey';

const useTokenWatchlists = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTokenWatchlistsKey(),
    queryFn: buildTokenWatchlistsFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useNonSuspenseTokenWatchlists = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTokenWatchlistsKey(),
    queryFn: buildTokenWatchlistsFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNonSuspenseTokenWatchlists, useTokenWatchlists };
