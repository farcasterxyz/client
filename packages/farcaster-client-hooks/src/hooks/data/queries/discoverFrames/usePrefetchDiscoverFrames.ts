import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDiscoveryFrameCategory,
  ApiDiscoveryFrameList,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDiscoverFramesFetcher } from './buildDiscoverFramesFetcher';
import { buildDiscoverFramesKey } from './buildDiscoverFramesKey';

const usePrefetchDiscoverFrames = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      list,
      categoryFilter,
    }: {
      list: ApiDiscoveryFrameList;
      categoryFilter?: ApiDiscoveryFrameCategory;
    }) => {
      const queryKey = buildDiscoverFramesKey({
        list,
        categoryFilter,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildDiscoverFramesFetcher({
          apiClient,
          list,
          categoryFilter,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDiscoverFrames };
