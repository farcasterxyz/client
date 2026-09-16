import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildCastRecastersFetcher } from './buildCastRecastersFetcher';
import { buildCastRecastersKey } from './buildCastRecastersKey';

const usePrefetchCastRecasters = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHash,
      shouldSkipIfRecentlyPrefetched,
    }: {
      castHash: string;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildCastRecastersKey({ castHash });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildCastRecastersFetcher({
          apiClient,
          castHash,
          batchMergeIntoGloballyCachedUsers,
        }),
      });
    },
    [
      checkIfRecentlyPrefetched,
      queryClient,
      apiClient,
      batchMergeIntoGloballyCachedUsers,
    ],
  );
};

export { usePrefetchCastRecasters };
