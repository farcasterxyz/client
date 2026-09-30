import {
  ApiChannelCastingMode,
  ApiChannelHeaderAction,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateChannel } from '../queries/channel/useInvalidateChannel';
import { useInvalidateChannelDetails } from '../queries/channelDetails/useInvalidateChannelDetails';
import { useInvalidateChannelSettings } from '../queries/channelSettings/useInvalidateChannelSettings';
import { useInvalidateFeedSummaries } from '../queries/feedSummaries/useInvalidateFeedSummaries';
import { useInvalidateGloballyCachedChannel } from '../queries/globallyCachedChannel/useInvalidateGloballyCachedChannel';
import { useInvalidateHighlightedChannels } from '../queries/highlightedChannels/useInvalidateHighlightedChannels';

export const MAX_PASS_PRICE_WARPS = 1000000;

export interface ChannelUpdateAttributes {
  name?: string;
  imageUrl?: string;
  headerImageUrl?: string;
  description?: string;
  ownerFid?: number;
  headerAction?: ApiChannelHeaderAction;
  publicCasting?: boolean;
  castingMode?: ApiChannelCastingMode;
}

interface ChannelUpdateProps extends ChannelUpdateAttributes {
  key: string;
}

export const useUpdateChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateGloballyCachedChannel = useInvalidateGloballyCachedChannel();
  const invalidateChannel = useInvalidateChannel();
  const invalidateChannelDetails = useInvalidateChannelDetails();
  const invalidateChannelSettings = useInvalidateChannelSettings();
  const invalidateFeedSummaries = useInvalidateFeedSummaries();
  const invalidateHighlightedChannels = useInvalidateHighlightedChannels();

  return useCallback(
    async ({
      key,
      name,
      imageUrl,
      headerImageUrl,
      description,
      ownerFid,
      headerAction,
      publicCasting,
      castingMode,
    }: ChannelUpdateProps) => {
      const response = await apiClient.updateChannel({
        key,
        name,
        imageUrl,
        headerImageUrl,
        description,
        ownerFid,
        headerAction,
        publicCasting,
        castingMode,
      });

      // These two run the same fetcher which creates race conditions where one is not updated correctly,
      // so ensure they are invalidated immediately after each other
      invalidateGloballyCachedChannel({ key }).then(() =>
        invalidateChannel({ key }),
      );
      invalidateChannelDetails({ key });
      invalidateChannelSettings({ key });
      invalidateFeedSummaries();
      invalidateHighlightedChannels();

      return response.data.result;
    },
    [
      apiClient,
      invalidateChannel,
      invalidateChannelDetails,
      invalidateChannelSettings,
      invalidateFeedSummaries,
      invalidateGloballyCachedChannel,
      invalidateHighlightedChannels,
    ],
  );
};
