import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useGetVideoState = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ videoId }: { videoId: string }) => {
      try {
        const result = await apiClient.getVideoState({ videoId });
        return result.data.result.video;
      } catch (error) {
        throw error;
      }
    },
    [apiClient],
  );
};

export { useGetVideoState };
