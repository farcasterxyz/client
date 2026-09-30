import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useSetupAdvancedProtection = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      account,
      enabled,
    }: {
      account: LocalAccountWithSign;
      enabled: boolean;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const { data } = await apiClient.setupAdvancedProtection(
        {
          enabled,
          authRequest: custodyBearerPayload,
        },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );

      return data.result;
    },
    [apiClient],
  );
};

export { useSetupAdvancedProtection };
