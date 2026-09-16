import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildFollowersYouKnowFetcher } from './buildFollowersYouKnowFetcher';
import { buildFollowersYouKnowKey } from './buildFollowersYouKnowKey';

const useFollowersYouKnow = ({
  fid,
  limit,
}: {
  fid: number;
  limit: number;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildFollowersYouKnowKey({ fid, limit }),

    queryFn: buildFollowersYouKnowFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      fid,
      limit,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useFollowersYouKnow };
