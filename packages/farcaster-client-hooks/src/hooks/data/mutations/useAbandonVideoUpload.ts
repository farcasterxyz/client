import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useAbandonVideoUpload = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ videoId }: { videoId: string }) => {
      await apiClient.abandonVideoUpload({ videoId });
    },
    [apiClient],
  );
};

export { useAbandonVideoUpload };
