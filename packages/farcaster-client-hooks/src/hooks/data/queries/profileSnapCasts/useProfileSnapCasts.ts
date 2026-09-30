import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildProfileSnapCastsFetcher } from './buildProfileSnapCastsFetcher';
import { buildProfileSnapCastsKey } from './buildProfileSnapCastsKey';
import { profileSnapCastsDefaultQueryOptions } from './profileSnapCastsDefaultQueryOptions';

const useProfileSnapCasts = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    ...profileSnapCastsDefaultQueryOptions,
    initialPageParam: undefined,
    queryKey: buildProfileSnapCastsKey({ fid }),

    queryFn: buildProfileSnapCastsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      fid,
    }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useProfileSnapCasts };
