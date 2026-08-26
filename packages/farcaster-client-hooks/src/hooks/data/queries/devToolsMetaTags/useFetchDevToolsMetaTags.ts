import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsMetaTagsFetcher } from './buildDevToolsMetaTagsFetcher';

const useFetchDevToolsMetaTags = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ url }: { url: string | undefined }) => {
      if (!url) {
        return null;
      }

      const result = await buildDevToolsMetaTagsFetcher({
        apiClient,
        url,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsMetaTags };
