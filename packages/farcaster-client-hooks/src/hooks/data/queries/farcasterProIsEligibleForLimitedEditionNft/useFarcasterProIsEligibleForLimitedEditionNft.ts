import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFarcasterProIsEligibleForLimitedEditionNftFetcher } from './buildFarcasterProIsEligibleForLimitedEditionNft';
import { buildFarcasterProIsEligibleForLimitedEditionNftKey } from './buildFarcasterProIsEligibleForLimitedEditionNftKey';

const useFarcasterProIsEligibleForLimitedEditionNft = ({
  fid,
}: {
  fid: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildFarcasterProIsEligibleForLimitedEditionNftKey({ fid }),

    queryFn: buildFarcasterProIsEligibleForLimitedEditionNftFetcher({
      apiClient,
      fid,
    }),
  });
};

export { useFarcasterProIsEligibleForLimitedEditionNft };
