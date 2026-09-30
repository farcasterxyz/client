import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useStartOnboardingXAuthLink = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ account }: { account: LocalAccountWithSign }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const response = await apiClient.startOnboardingXAuthLink(
        { authRequest: custodyBearerPayload },
        { headers: { Authorization: `Bearer ${custodyBearerToken}` } },
      );

      return response.data;
    },
    [apiClient],
  );
};

export { useStartOnboardingXAuthLink };
