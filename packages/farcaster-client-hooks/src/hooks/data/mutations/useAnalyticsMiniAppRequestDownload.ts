import { useMutation } from '@tanstack/react-query';
import {
  type ApiAnalyticsMiniAppRequestDownloadRequestBody,
  isFarcasterApiError,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useAnalyticsMiniAppRequestDownload = () => {
  const { apiClient } = useFarcasterApiClient();

  return useMutation({
    mutationFn: async (body: ApiAnalyticsMiniAppRequestDownloadRequestBody) => {
      try {
        const { data } = await apiClient.analyticsMiniAppRequestDownload(body);
        return data.result;
      } catch (error) {
        if (isFarcasterApiError(error)) {
          throw new Error(error.message);
        }
        throw error;
      }
    },
  });
};
