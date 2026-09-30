import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGenerateImageUploadUrlFetcher } from './buildGenerateImageUploadUrlFetcher';

const useFetchImageUploadUrl = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const data = await buildGenerateImageUploadUrlFetcher({
      apiClient,
    })();

    return data;
  }, [apiClient]);
};

export { useFetchImageUploadUrl };
