import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildLookupOnboardingStateFetcher } from './buildLookupOnboardingStateFetcher';

const useFetchLookupOnboardingState = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ email }: { email: string }) => {
      return await buildLookupOnboardingStateFetcher({
        apiClient,
        email,
      })();
    },
    [apiClient],
  );
};

export { useFetchLookupOnboardingState };
