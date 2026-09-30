import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { activeChannelStreakDefaultQueryOptions } from './activeChannelStreakDefaultQueryOptions';
import { buildActiveChannelStreakFetcher } from './buildActiveChannelStreakFetcher';
import { buildActiveChannelStreakKey } from './buildActiveChannelStreakKey';

const usePrefetchActiveChannelStreak = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildActiveChannelStreakKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchQuery({
        ...activeChannelStreakDefaultQueryOptions,
        queryKey: queryKey,

        queryFn: buildActiveChannelStreakFetcher({
          apiClient,
          fid,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchActiveChannelStreak };
