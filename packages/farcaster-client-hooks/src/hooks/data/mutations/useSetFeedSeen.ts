import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetFeedSeen = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      feedKey,
      feedType,
      latestItemTimestamp,
      accessTimestamp,
    }: {
      feedKey: string;
      feedType: string;
      latestItemTimestamp: number;
      accessTimestamp: number;
    }) => {
      try {
        await apiClient.setFeedSeen({
          feeds: [
            {
              feedKey: feedKey,
              feedType,
              latestItemTimestamp,
              accessTimestamp,
            },
          ],
        });
      } catch (error) {
        // ignore, as a filure here or there shouldn't impact the experience
      }
    },
    [apiClient],
  );
};

export { useSetFeedSeen };
