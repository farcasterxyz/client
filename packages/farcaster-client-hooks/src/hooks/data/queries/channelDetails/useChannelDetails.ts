import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildChannelDetailsFetcher } from './buildChannelDetailsFetcher';
import { buildChannelDetailsKey } from './buildChannelDetailsKey';

const useChannelDetails = (
  { key }: { key: string },
  options?: Partial<{ enabled: boolean }>,
) => {
  const { apiClient } = useFarcasterApiClient();
  return useSuspenseQuery({
    queryKey: buildChannelDetailsKey({ key }),

    queryFn: buildChannelDetailsFetcher({
      apiClient,
      key,
    }),

    ...options,
  });
};

const useNonSuspenseChannelDetails = (
  { key }: { key: string },
  options?: Partial<{ enabled: boolean; staleTime: number }>,
) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildChannelDetailsKey({ key }),

    queryFn: buildChannelDetailsFetcher({
      apiClient,
      key,
    }),

    ...options,
  });
};

export { useChannelDetails, useNonSuspenseChannelDetails };
