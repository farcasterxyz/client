import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildInvitedFetcher } from './buildInvitedFetcher';

const useFetchInvited = () => {
  const { apiClient } = useFarcasterApiClient();
  return useCallback(
    async ({ email }: { email: string }) => {
      return await buildInvitedFetcher({
        apiClient,
        email,
      })();
    },
    [apiClient],
  );
};

export { useFetchInvited };
