import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildProfileSnapCastsFetcher } from './buildProfileSnapCastsFetcher';
import { buildProfileSnapCastsKey } from './buildProfileSnapCastsKey';

const usePurgedProfileSnapCasts = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = usePurgedInfiniteQuery(
    buildProfileSnapCastsKey({ fid }),
    buildProfileSnapCastsFetcher({
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

export { usePurgedProfileSnapCasts };
