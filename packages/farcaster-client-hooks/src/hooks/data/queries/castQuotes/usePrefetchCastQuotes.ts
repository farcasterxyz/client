import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildCastQuotesFetcher } from './buildCastQuotesFetcher';
import { buildCastQuotesKey } from './buildCastQuotesKey';

const usePrefetchCastQuotes = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHash,
      shouldSkipIfRecentlyPrefetched,
    }: {
      castHash: string;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildCastQuotesKey({ castHash });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildCastQuotesFetcher({
          apiClient,
          castHash,
          batchMergeIntoGloballyCachedCasts,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchCastQuotes };
