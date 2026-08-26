import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const usePrepareVideoUpload = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      videoSizeBytes,
      supportsDynamicUpload,
      clientUploadMetadata,
    }: {
      videoSizeBytes: number;
      supportsDynamicUpload: boolean;
      clientUploadMetadata?: unknown;
    }) => {
      try {
        const result = await apiClient.prepareVideoUpload({
          videoSizeBytes,
          supportsDynamicUpload,
          clientUploadMetadata,
        });
        return result.data.result;
      } catch (error) {
        throw error;
      }
    },
    [apiClient],
  );
};

export { usePrepareVideoUpload };
