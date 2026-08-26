import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserLikedCastsFetcher } from './buildUserLikedCastsFetcher';
import { buildUserLikedCastsKey } from './buildUserLikedCastsKey';

const useUserLikedCasts = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserLikedCastsKey({ fid }),

    queryFn: buildUserLikedCastsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      fid,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useUserLikedCasts };
