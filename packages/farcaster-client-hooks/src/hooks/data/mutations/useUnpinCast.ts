import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFeedItems } from '../queries/feedItems/useInvalidateFeedItems';

const useUnpinCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFeedItems = useInvalidateFeedItems();

  return useCallback(
    async ({
      castHash,
      channelKey,
    }: {
      castHash: string;
      channelKey: string;
    }) => {
      await apiClient.removeCastBoost({
        castHash,
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

export { useUnpinCast };
