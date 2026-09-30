import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFarcasterProIsEligibleForLimitedEditionNftFetcher } from './buildFarcasterProIsEligibleForLimitedEditionNft';
import { buildFarcasterProIsEligibleForLimitedEditionNftKey } from './buildFarcasterProIsEligibleForLimitedEditionNftKey';

const usePrefetchFarcasterProIsEligibleForLimitedEditionNft = ({
  fid,
}: {
  fid: number;
}) => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      queryKey: buildFarcasterProIsEligibleForLimitedEditionNftKey({ fid }),

      queryFn: buildFarcasterProIsEligibleForLimitedEditionNftFetcher({
        apiClient,
        fid,
      }),
    });
  }, [apiClient, fid, queryClient]);
};

export { usePrefetchFarcasterProIsEligibleForLimitedEditionNft };
