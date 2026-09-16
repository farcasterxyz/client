import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFarcasterProSubscribeWithUsdcDetailsFetcher } from './buildFarcasterProSubscribeWithUsdcDetailsFetcher';
import { buildFarcasterProSubscribeWithUsdcDetailsKey } from './buildFarcasterProSubscribeWithUsdcDetailsKey';

const useFarcasterProSubscribeWithUsdcDetails = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildFarcasterProSubscribeWithUsdcDetailsKey(),

    queryFn: buildFarcasterProSubscribeWithUsdcDetailsFetcher({
      apiClient,
    }),

    staleTime: 0,
    gcTime: 0,
  });
};

export { useFarcasterProSubscribeWithUsdcDetails };
