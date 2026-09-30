import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDraftCastsFetcher } from './buildDraftCastsFetcher';
import { buildDraftCastsKey } from './buildDraftCastsKey';

const usePrefetchDraftCasts = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      channelKey,
      shouldSkipIfRecentlyPrefetched,
    }: {
      channelKey: string | undefined;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildDraftCastsKey({ channelKey });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildDraftCastsFetcher({
          apiClient,
          channelKey,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDraftCasts };
