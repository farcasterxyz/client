import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildThreadFetcher } from './buildThreadFetcher';
import { buildThreadKey } from './buildThreadKey';

const useThread = ({ castHash }: { castHash: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildThreadKey({ castHash }),

    queryFn: buildThreadFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      castHash,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useNonSuspenseThread = ({
  castHash,
  throwOnError = false,
}: {
  castHash: string;
  throwOnError?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const enabled = Boolean(castHash);

  const result = useInfiniteQuery({
    gcTime: 0,
    initialPageParam: undefined,
    queryKey: buildThreadKey({ castHash }),
    enabled,

    queryFn: buildThreadFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      castHash,
    }),

    getNextPageParam: getNextPageCursor,
    throwOnError,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNonSuspenseThread, useThread };
