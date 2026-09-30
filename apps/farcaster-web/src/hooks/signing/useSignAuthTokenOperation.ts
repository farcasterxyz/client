import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
  DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
  FarcasterApiClient,
} from 'farcaster-client-data';
import { useCallback } from 'react';
import { mnemonicToAccount } from 'viem/accounts';

const useSignAuthTokenOperation = () => {
  return useCallback(
    async ({
      mnemonic,
      apiClient,
    }: {
      mnemonic: string;
      apiClient: FarcasterApiClient;
    }) => {
      const account = mnemonicToAccount(mnemonic);
      const custodyBearerPayload = buildCustodyBearerPayload({
        expiresIn: DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
      });
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });
      const response = await apiClient.getOnboardingStateAndAuthToken(
        { authRequest: custodyBearerPayload },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );
      const result = response.data.result;
      return {
        ...result,
        address: account.address,
      };
    },
    [],
  );
};

export { useSignAuthTokenOperation };
