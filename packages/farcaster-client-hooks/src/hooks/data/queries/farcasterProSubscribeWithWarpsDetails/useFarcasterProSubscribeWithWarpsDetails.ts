import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFarcasterProSubscribeWithWarpsDetailsFetcher } from './buildFarcasterProSubscribeWithWarpsDetailsFetcher';
import { buildFarcasterProSubscribeWithWarpsDetailsKey } from './buildFarcasterProSubscribeWithWarpsDetailsKey';

const useFarcasterProSubscribeWithWarpsDetails = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildFarcasterProSubscribeWithWarpsDetailsKey(),

    queryFn: buildFarcasterProSubscribeWithWarpsDetailsFetcher({
      apiClient,
    }),

    staleTime: 0,
    gcTime: 0,
  });
};

export { useFarcasterProSubscribeWithWarpsDetails };
