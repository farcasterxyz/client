import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

export const useStartPhoneVerification = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      phone,
      account,
    }: {
      phone: string;
      account: LocalAccountWithSign;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const { data } = await apiClient.startPhoneVerification(
        {
          phone,
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
