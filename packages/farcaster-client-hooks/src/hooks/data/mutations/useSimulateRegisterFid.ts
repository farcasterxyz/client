import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

export const useSimulateRegisterFid = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      recoveryAddress,
      account,
    }: {
      recoveryAddress: string | undefined;
      account: LocalAccountWithSign;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const deadline = Math.floor(Date.now() / 1000 + 600);
      const hashesResult = await apiClient.generateRegistrationHashes(
        {
          deadline,
          authRequest: custodyBearerPayload,
        },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );

      const signerSignature = await account.sign({
        hash: hashesResult.data.result.signerHash as Hex,
      });
      const registerSignature = await account.sign({
        hash: hashesResult.data.result.registerHash as Hex,
      });

      return apiClient.simulateRegisterFid(
        {
          authRequest: custodyBearerPayload,
          recoveryAddress,
          signerSignature,
          registerSignature,
          deadline,
        },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );
    },
    [apiClient],
  );
};
