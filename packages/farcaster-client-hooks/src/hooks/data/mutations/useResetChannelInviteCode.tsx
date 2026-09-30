import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildChannelKey } from '../queries/channel/buildChannelKey';
import { useMergeIntoGloballyCachedChannel } from '../queries/globallyCachedChannel/useMergeIntoGloballyCachedChannel';

export const useResetChannelInviteCode = () => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({ channelKey }: { channelKey: string }) => {
      const response = await apiClient.resetChannelInviteCode({
        channelKey,
      });

      trackEvent(AnalyticsEvent.ResetChannelInviteLink, { channelKey });
      queryClient.setQueryData<ApiChannel>(
        buildChannelKey({ key: channelKey }),
        (data) => {
          if (!data) {
            return;
          }

          return {
            ...data,
            inviteCode: response.data.result.inviteCode,
          };
        },
      );

      mergeIntoGloballyCachedChannel({
        updates: {
          key: channelKey,
          inviteCode: response.data.result.inviteCode,
        },
      });
    },
    [apiClient, trackEvent, queryClient, mergeIntoGloballyCachedChannel],
  );
};
