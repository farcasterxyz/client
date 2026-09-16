import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFeedItems } from '../queries/feedItems/useInvalidateFeedItems';

const usePinCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFeedItems = useInvalidateFeedItems();

  return useCallback(
    async ({
      castHash,
      notifyChannelMembers,
      channelKey,
    }: {
      castHash: string;
      notifyChannelMembers: boolean;
      channelKey: string;
    }) => {
      await apiClient.boostCast({
        castHash,
        notifyChannelMembers,
      });

      for (const feedType of ['default', 'curated', 'priority', 'members']) {
        void invalidateFeedItems({
          feedKey: channelKey,
          feedType,
        });
      }
    },
    [apiClient, invalidateFeedItems],
  );
};

export { usePinCast };
