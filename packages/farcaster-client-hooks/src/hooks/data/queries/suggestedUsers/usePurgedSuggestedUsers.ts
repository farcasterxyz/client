import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildSuggestedUsersFetcher } from './buildSuggestedUsersFetcher';
import { buildSuggestedUsersKey } from './buildSuggestedUsersKey';

const usePurgedSuggestedUsers = ({
  limit,
  randomized,
}: {
  limit?: number;
  randomized: boolean | undefined;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = usePurgedInfiniteQuery(
    buildSuggestedUsersKey({ limit, randomized }),
    buildSuggestedUsersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      randomized,
    }),
    {
      initialPageParam: undefined,
      getNextPageParam: getNextPageCursor,
    },
  );

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { usePurgedSuggestedUsers };
