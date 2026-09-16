import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildUserCastsFetcher } from './buildUserCastsFetcher';
import { buildUserCastsKey } from './buildUserCastsKey';

const usePurgedUserCasts = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = usePurgedInfiniteQuery(
    buildUserCastsKey({ fid }),
    buildUserCastsFetcher({
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

export { usePurgedUserCasts };
