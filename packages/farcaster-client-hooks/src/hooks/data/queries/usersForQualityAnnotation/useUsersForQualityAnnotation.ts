import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildUsersForQualityAnnotationFetcher } from './buildUsersForQualityAnnotationFetcher';
import { buildUsersForQualityAnnotationKey } from './buildUsersForQualityAnnotationKey';

const useUsersForQualityAnnotation = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUsersForQualityAnnotationKey(),

    queryFn: buildUsersForQualityAnnotationFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useUsersForQualityAnnotation };
