import { useQueryClient } from '@tanstack/react-query';
import { ApiGetActiveChannelStreak200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildActiveChannelStreakKey } from '../queries/activeChannelStreak/buildActiveChannelStreakKey';

const useStopActiveChannelStreak = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      const response = await apiClient.stopActiveChannelStreaks();

      queryClient.setQueryData<ApiGetActiveChannelStreak200Response>(
        buildActiveChannelStreakKey({ fid }),
        (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          return {
            result: { streak: undefined },
          };
        },
      );

      return response.data;
    },
    [apiClient, queryClient],
  );
};

export { useStopActiveChannelStreak };
