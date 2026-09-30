import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDeleteCastFromTrendingTopic = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ topicId, castHash }: { topicId: string; castHash: string }) => {
      await apiClient.deleteCastFromTrendingTopic({ topicId, castHash });
    },
    [apiClient],
  );
};

export { useDeleteCastFromTrendingTopic };
