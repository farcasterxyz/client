import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildFollowingFetcher } from './buildFollowingFetcher';
import { buildFollowingKey } from './buildFollowingKey';

const usePurgedFollowing = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = usePurgedInfiniteQuery(
    buildFollowingKey({ fid }),
    buildFollowingFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      fid,
    }),
    {
      initialPageParam: undefined,
      getNextPageParam: getNextPageCursor,
    },
  );

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { usePurgedFollowing };
