import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildDirectCastUsersFetcher } from './buildDirectCastUsersFetcher';
import { buildDirectCastUsersKey } from './buildDirectCastUsersKey';

const useDirectCastUsers = ({
  q,
  excludeFids,
}: {
  q: string;
  excludeFids?: number[];
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  // Managing the loading state in-component.
  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDirectCastUsersKey({ q, excludeFids }),

    queryFn: buildDirectCastUsersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      q,
      excludeFids,
    }),

    getNextPageParam: getNextPageCursor,
    enabled: !!q,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useDirectCastUsers };
