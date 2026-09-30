import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildLocationUsersFetcher } from './buildLocationUsersFetcher';
import { buildLocationUsersKey } from './buildLocationUsersKey';

const useLocationUsers = ({ placeId }: { placeId: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildLocationUsersKey({ placeId }),

    queryFn: buildLocationUsersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      placeId,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useLocationUsers };
