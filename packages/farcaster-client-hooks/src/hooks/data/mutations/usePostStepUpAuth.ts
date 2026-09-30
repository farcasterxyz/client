import { useMutation } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export function usePostStepUpAuth() {
  const { apiClient } = useFarcasterApiClient();
  return useMutation({
    mutationFn: async ({
      message,
      signature,
    }: {
      message: string;
      signature: string;
    }) => {
      const result = await apiClient.postStepUpMessage({
        message,
        signature,
      });
      return result;
    },
  });
}
