import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsFarcasterJsonFetcher } from './buildDevToolsFarcasterJsonFetcher';

const useFetchDevToolsFarcasterJson = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string | undefined }) => {
      if (!domain) {
        return null;
      }

      const result = await buildDevToolsFarcasterJsonFetcher({
        apiClient,
        domain,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsFarcasterJson };
