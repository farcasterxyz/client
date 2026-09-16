import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildSearchUsersFetcher } from './buildSearchUsersFetcher';
import { buildSearchUsersKey } from './buildSearchUsersKey';
import { defaultLimit } from './shared';

const gcTime = MILLIS_PER_MINUTE;

const useSearchUsers = ({
  limit = defaultLimit,
  q,
  excludeSelf = false,
  prioritizeFids,
  includeDirectCastAbility = false,
}: {
  limit?: number;
  q: string;
  excludeSelf?: boolean;
  prioritizeFids?: number[];
  includeDirectCastAbility?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchUsersKey({ q, limit, prioritizeFids }),

    queryFn: buildSearchUsersFetcher({
      q,
      excludeSelf,
      prioritizeFids,
      limit,
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      includeDirectCastAbility,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useNonSuspenseSearchUsers = ({
  limit = defaultLimit,
  q,
  excludeSelf = false,
  prioritizeFids,
  includeDirectCastAbility = false,
}: {
  limit?: number;
  q?: string;
  excludeSelf?: boolean;
  prioritizeFids?: number[];
  includeDirectCastAbility?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchUsersKey({
      q,
      limit,
      prioritizeFids,
      includeDirectCastAbility,
    }),

    queryFn: buildSearchUsersFetcher({
      q: q ?? '',
      excludeSelf,
      prioritizeFids,
      limit,
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      includeDirectCastAbility,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,

    // Set placeholder data so that fetching doesn't block rendering on initial load and when
    // changing the query. This, in tandem with the logic in useFlatSearchUsersData allows us
    // to return an undefined result and show the loading spinner
    placeholderData: {
      pages: [],
      pageParams: [],
    },
    enabled: !!q,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNonSuspenseSearchUsers, useSearchUsers };
