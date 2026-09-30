import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildUserCastsAndRepliesFetcher } from './buildUserCastsAndRepliesFetcher';
import { buildUserCastsAndRepliesKey } from './buildUserCastsAndRepliesKey';

const usePurgedUserCastsAndReplies = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = usePurgedInfiniteQuery(
    buildUserCastsAndRepliesKey({ fid }),
    buildUserCastsAndRepliesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
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

export { usePurgedUserCastsAndReplies };
