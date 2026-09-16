import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsInspectMiniAppUrlFetcher } from './buildDevToolsInspectMiniAppUrlFetcher';

const useFetchDevToolsInspectMiniAppUrl = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ url }: { url: string | undefined }) => {
      if (!url) {
        return null;
      }

      const result = await buildDevToolsInspectMiniAppUrlFetcher({
        apiClient,
        url,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsInspectMiniAppUrl };
