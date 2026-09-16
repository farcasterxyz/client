import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { buildNewsFetcher } from './buildNewsFetcher';
import { buildNewsKey } from './buildNewsKey';

const useNews = () => {
  const { apiClient } = useFarcasterApiClient();

  // Not used for regular fetches but utilized during prefetching.
  const onResponse = useCallback(() => {}, []);

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildNewsKey(),
    queryFn: buildNewsFetcher({ apiClient, onResponse }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNews };
