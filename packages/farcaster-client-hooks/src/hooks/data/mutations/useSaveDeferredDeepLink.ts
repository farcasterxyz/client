import { useMutation } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useSaveDeferredDeepLink = () => {
  const { apiClient } = useFarcasterApiClient();

  return useMutation({
    mutationFn: async ({ targetPath }: { targetPath: string }) => {
      const result = await apiClient.saveDeferredDeepLink({ targetPath });
      if (result.data.result.saved !== true) {
        throw new Error('Failed to save deferred deep link');
      }
      return true;
    },
  });
};
