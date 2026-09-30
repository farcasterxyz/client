import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildUserCastsAndRepliesFetcher } from './buildUserCastsAndRepliesFetcher';
import { buildUserCastsAndRepliesKey } from './buildUserCastsAndRepliesKey';

const usePrefetchUserCastsAndReplies = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildUserCastsAndRepliesKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildUserCastsAndRepliesFetcher({
          apiClient,
          batchMergeIntoGloballyCachedCasts,
          fid,
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

export { usePrefetchUserCastsAndReplies };
