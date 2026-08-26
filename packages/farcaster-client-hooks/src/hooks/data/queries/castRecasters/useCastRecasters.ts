import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildCastRecastersFetcher } from './buildCastRecastersFetcher';
import { buildCastRecastersKey } from './buildCastRecastersKey';

const useCastRecasters = ({ castHash }: { castHash: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildCastRecastersKey({ castHash }),

    queryFn: buildCastRecastersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,

      castHash,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useCastRecasters };
