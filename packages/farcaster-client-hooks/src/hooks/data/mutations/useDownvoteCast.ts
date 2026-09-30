import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useRemoveCastFromFeed } from '../queries/feedItems/useRemoveCastFromFeed';

const useDownvoteCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const removeCastFromFeed = useRemoveCastFromFeed();

  return useCallback(
    async ({
      castHash,
      channelKey,
      downvote,
      isWarning,
    }: {
      castHash: string;
      channelKey?: string;
      downvote: boolean;
      isWarning?: boolean;
    }) => {
      await apiClient.downvoteCast({
        castHash,
        downvote,
        isWarning: isWarning ?? false,
      });

      if (downvote && channelKey) {
        removeCastFromFeed({
          feedKey: channelKey,
          feedType: 'default',
          castHash,
        });
        removeCastFromFeed({
          feedKey: channelKey,
          feedType: 'curated',
          castHash,
        });
      }
    },
    [apiClient, removeCastFromFeed],
  );
};

export { useDownvoteCast };
