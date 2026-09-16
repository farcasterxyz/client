import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsInspectImageUrlFetcher } from './buildDevToolsInspectImageUrlFetcher';

const useFetchDevToolsInspectImageUrl = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ url }: { url: string | undefined }) => {
      if (!url) {
        return null;
      }

      const result = await buildDevToolsInspectImageUrlFetcher({
        apiClient,
        url,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsInspectImageUrl };
