import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserThreadHiddenRepliesFetcher } from './buildUserThreadHiddenRepliesFetcher';
import { buildUserThreadHiddenRepliesKey } from './buildUserThreadHiddenRepliesKey';

const useUserThreadHiddenReplies = ({
  focusedCastHash,
}: {
  focusedCastHash: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserThreadHiddenRepliesKey({ focusedCastHash }),

    queryFn: buildUserThreadHiddenRepliesFetcher({
      apiClient,
      focusedCastHash,
      batchMergeIntoGloballyCachedCasts,
    }),
    getNextPageParam: getNextPageCursor,
  });
};

export { useUserThreadHiddenReplies };
