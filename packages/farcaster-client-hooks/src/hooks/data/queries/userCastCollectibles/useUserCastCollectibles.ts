import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildUserCastCollectiblesFetcher } from './buildUserCastCollectiblesFetcher';
import { buildUserCastCollectiblesKey } from './buildUserCastCollectiblesKey';

const useUserCastCollectibles = ({
  fid,
  enabled = true,
}: {
  fid: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  return useQuery({
    queryKey: buildUserCastCollectiblesKey({ fid }),
    queryFn: buildUserCastCollectiblesFetcher({
      apiClient,
      fid,
      batchMergeIntoGloballyCachedCasts,
    }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
};
export { useUserCastCollectibles };
