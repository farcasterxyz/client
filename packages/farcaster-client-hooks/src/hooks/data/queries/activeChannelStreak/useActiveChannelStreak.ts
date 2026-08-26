import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { activeChannelStreakDefaultQueryOptions } from './activeChannelStreakDefaultQueryOptions';
import { buildActiveChannelStreakFetcher } from './buildActiveChannelStreakFetcher';
import { buildActiveChannelStreakKey } from './buildActiveChannelStreakKey';

const useActiveChannelStreak = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    ...activeChannelStreakDefaultQueryOptions,
    queryKey: buildActiveChannelStreakKey({ fid }),

    queryFn: buildActiveChannelStreakFetcher({
      apiClient,
      fid,
    }),
  });
};

const useNonSuspenseActiveChannelStreak = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...activeChannelStreakDefaultQueryOptions,
    queryKey: buildActiveChannelStreakKey({ fid }),

    queryFn: buildActiveChannelStreakFetcher({
      apiClient,
      fid,
    }),
  });
};

export { useActiveChannelStreak, useNonSuspenseActiveChannelStreak };
