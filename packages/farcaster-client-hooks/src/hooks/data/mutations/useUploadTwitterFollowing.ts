import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUploadTwitterFollowing = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ following }: { following: string[] }) => {
      return await apiClient.uploadTwitterFollowing({ following });
    },
    [apiClient],
  );
};

export { useUploadTwitterFollowing };
