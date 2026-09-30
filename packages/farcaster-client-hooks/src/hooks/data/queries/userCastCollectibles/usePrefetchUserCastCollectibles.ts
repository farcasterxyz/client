import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserCastCollectiblesFetcher } from './buildUserCastCollectiblesFetcher';
import { buildUserCastCollectiblesKey } from './buildUserCastCollectiblesKey';

const usePrefetchUserCastCollectibles = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const prefetchUserCastCollectibles = useCallback(
    ({ fid }: { fid: number }) => {
      return queryClient.prefetchQuery({
        queryKey: buildUserCastCollectiblesKey({ fid }),
        queryFn: buildUserCastCollectiblesFetcher({
          apiClient,
          fid,
          batchMergeIntoGloballyCachedCasts,
        }),
        staleTime: MILLIS_PER_MINUTE * 5,
      });
    },
    [apiClient, queryClient, batchMergeIntoGloballyCachedCasts],
  );

  return { prefetchUserCastCollectibles };
};

export { usePrefetchUserCastCollectibles };
