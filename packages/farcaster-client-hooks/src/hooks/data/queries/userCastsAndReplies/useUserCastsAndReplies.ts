import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildUserCastsAndRepliesFetcher } from './buildUserCastsAndRepliesFetcher';
import { buildUserCastsAndRepliesKey } from './buildUserCastsAndRepliesKey';

const useUserCastsAndReplies = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserCastsAndRepliesKey({ fid }),

    queryFn: buildUserCastsAndRepliesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      fid,
    }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useUserCastsAndReplies };
