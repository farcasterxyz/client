import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGenerateImageUploadUrlFetcher } from './buildGenerateImageUploadUrlFetcher';
import { buildGenerateImageUploadUrlKey } from './buildGenerateImageUploadUrlKey';

const useGenerateImageUploadUrl = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildGenerateImageUploadUrlKey(),
    queryFn: buildGenerateImageUploadUrlFetcher({ apiClient }),

    // We will refetch every 15 minutes so its not stale
    refetchInterval: 900000,
  });
};

export { useGenerateImageUploadUrl };
