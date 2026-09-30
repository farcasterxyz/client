import {
  ApiVerifyEmailWithCodeRequestBody,
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useVerifyEmailWithCode = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      account,
      params,
    }: {
      account: LocalAccountWithSign;
      params: Omit<ApiVerifyEmailWithCodeRequestBody, 'authRequest'>;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const response = await apiClient.verifyEmailWithCode(
        { ...params, authRequest: custodyBearerPayload },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );

      return response.data;
    },
    [apiClient],
  );
};

export { useVerifyEmailWithCode };
