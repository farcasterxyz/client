import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildIsFnameAvailableFetcher } from './buildIsFnameAvailableFetcher';

const useFetchIsFnameAvailable = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fname }: { fname: string }) => {
      const response = await buildIsFnameAvailableFetcher({
        apiClient,
        fname,
      })();

      return response;
    },
    [apiClient],
  );
};

export { useFetchIsFnameAvailable };
