import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildCastLikesFetcher } from './buildCastLikesFetcher';
import { buildCastLikesKey } from './buildCastLikesKey';

const useCastLikes = ({ castHash }: { castHash: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildCastLikesKey({ castHash }),

    queryFn: buildCastLikesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      castHash,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useCastLikes };
