import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyAddSelfInRole } from '../channelUsers';

export const useJoinChannelViaCode = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyAddSelfInRole = useOptimisticallyAddSelfInRole();

  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      channelKey,
      inviteCode,
    }: {
      fid: number;
      channelKey: string;
      inviteCode: string;
    }) =>
      await optimisticallyAddSelfInRole({
        channelKey,
        role: 'member',
        execute: async () => {
          const { data } = await apiClient.joinChannelViaCode({
            channelKey,
            inviteCode,
          });

          // track after we return success to ignore invalid attempts to join
          trackEvent(AnalyticsEvent.JoinChannelViaInviteCode, {
            channelKey,
          });

          return data.result;
        },
      }),
    [apiClient, optimisticallyAddSelfInRole, trackEvent],
  );
};
