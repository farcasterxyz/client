import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildCastLikesFetcher } from './buildCastLikesFetcher';
import { buildCastLikesKey } from './buildCastLikesKey';

const useFetchCastLikes = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const queryClient = useQueryClient();

  return useCallback(
    async ({ castHash }: { castHash: string }) => {
      const response = await buildCastLikesFetcher({
        apiClient,
        batchMergeIntoGloballyCachedUsers,
        castHash,
      })();

      queryClient.setQueryData(buildCastLikesKey({ castHash }), response);
    },
    [apiClient, batchMergeIntoGloballyCachedUsers, queryClient],
  );
};

export { useFetchCastLikes };
