import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { CastHashPrefix, getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserThreadCastsFetcher } from './buildUserThreadCastsFetcher';
import { buildUserThreadCastsKey } from './buildUserThreadCastsKey';

const useUserThreadCasts = ({
  castHashPrefix,
  username,
}: {
  castHashPrefix: CastHashPrefix;
  username: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserThreadCastsKey({ castHashPrefix, username }),

    queryFn: buildUserThreadCastsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      castHashPrefix,
      username,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useNonSuspenseUserThreadCasts = ({
  castHashPrefix,
  username,
  throwOnError = false,
}: {
  castHashPrefix: CastHashPrefix;
  username: string;
  throwOnError?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const enabled = Boolean(castHashPrefix && username);

  const result = useInfiniteQuery({
    gcTime: 0,
    initialPageParam: undefined,
    queryKey: buildUserThreadCastsKey({ castHashPrefix, username }),
    enabled,

    queryFn: buildUserThreadCastsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      castHashPrefix,
      username,
    }),

    getNextPageParam: getNextPageCursor,
    throwOnError,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNonSuspenseUserThreadCasts, useUserThreadCasts };
