import { useQueryClient } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';
import { useCallback } from 'react';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildNotificationsForTabFetcher } from './buildNotificationsForTabFetcher';
import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const usePrefetchNotificationsForTab = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  return useCallback(
    (tab: string) => {
      const queryKey = buildNotificationsForTabKey({ tab });

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined as undefined | string,
        queryKey: queryKey,
        queryFn: buildNotificationsForTabFetcher({
          apiClient,
          tab,
          batchMergeIntoGloballyCachedCasts,
          setLastCheckedTimestamp: false,
        }),
        getNextPageParam: getNextPageCursor,
        staleTime: MILLIS_PER_SECOND,
      });
    },
    [apiClient, queryClient, batchMergeIntoGloballyCachedCasts],
  );
};
