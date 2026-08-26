import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';
import { useMemo, useRef } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserThreadHiddenRepliesFetcher } from './buildUserThreadHiddenRepliesFetcher';
import { buildUserThreadHiddenRepliesKey } from './buildUserThreadHiddenRepliesKey';

const usePurgedUserThreadHiddenReplies = ({
  focusedCastHash,
  enabled,
}: {
  focusedCastHash: string;
  enabled: boolean;
}) => {
  const queryClient = useQueryClient();
  const cacheKey = useMemo(
    () => buildUserThreadHiddenRepliesKey({ focusedCastHash }),
    [focusedCastHash],
  );

  // Reset all data in-line without the timeout of usePurgedInfiniteQuery
  // so that we always start with hidden replies not shown
  const hasRenderedRef = useRef<boolean>(false);
  if (!hasRenderedRef.current) {
    queryClient.removeQueries({
      queryKey: cacheKey,
    });
    hasRenderedRef.current = true;
  }

  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: cacheKey,
    queryFn: buildUserThreadHiddenRepliesFetcher({
      apiClient,
      focusedCastHash,
      batchMergeIntoGloballyCachedCasts,
    }),
    getNextPageParam: getNextPageCursor,
    enabled,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { usePurgedUserThreadHiddenReplies };
