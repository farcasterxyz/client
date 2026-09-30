import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useRefetchFeedSummaries } from '../queries/feedSummaries/useRefetchFeedSummaries';

const useSetFavoriteFeedPosition = () => {
  const { apiClient } = useFarcasterApiClient();
  const refetchFeedSummaries = useRefetchFeedSummaries();

  return useCallback(
    async ({
      feedKey,
      position,
      moveCurrentToPosition,
    }: {
      feedKey: string;
      position: number;
      moveCurrentToPosition?: number;
    }) => {
      await apiClient.setFavoriteFeedPosition({
        feedKey,
        position,
        moveCurrentToPosition,
      });

      setTimeout(() => {
        refetchFeedSummaries();
      }, 3000);
    },
    [apiClient, refetchFeedSummaries],
  );
};

export { useSetFavoriteFeedPosition };
