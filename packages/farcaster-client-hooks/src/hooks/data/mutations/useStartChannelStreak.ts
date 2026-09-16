import { useQueryClient } from '@tanstack/react-query';
import {
  ApiChannelBasic,
  ApiGetActiveChannelStreak200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildActiveChannelStreakKey } from '../queries/activeChannelStreak/buildActiveChannelStreakKey';

const useStartChannelStreak = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({ fid, channel }: { fid: number; channel: ApiChannelBasic }) => {
      const response = await apiClient.startChannelStreak({
        channelKey: channel.key,
      });

      queryClient.setQueryData<ApiGetActiveChannelStreak200Response>(
        buildActiveChannelStreakKey({ fid }),
        (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          return {
            // TODO: Can we get the current streak for the viewer here somehow?
            // If we are fetching it from the server?
            result: { streak: { channel, streakCount: 0 } },
          };
        },
      );

      return response.data;
    },
    [apiClient, queryClient],
  );
};

export { useStartChannelStreak };
