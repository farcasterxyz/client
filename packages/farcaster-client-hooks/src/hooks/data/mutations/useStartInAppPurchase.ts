import {
  ApiInAppPurchaseMetadata,
  ApiOnchainTransactionType,
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { StartInAppPurchaseError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useStartInAppPurchase = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      onchainTransactionType,
      productId,
      metadata,
      account,
    }: {
      onchainTransactionType: ApiOnchainTransactionType;
      productId: string;
      metadata?: ApiInAppPurchaseMetadata;
      account: LocalAccountWithSign;
    }) => {
      try {
        const custodyBearerPayload = buildCustodyBearerPayload();
        const custodyBearerToken = await buildCustodyBearerToken({
          payload: custodyBearerPayload,
          account,
        });

        const response = await apiClient.startInAppPurchaseWithCustody(
          {
            authRequest: custodyBearerPayload,
            onchainTransactionType,
            productId,
            metadata,
          },
          {
            headers: { Authorization: `Bearer ${custodyBearerToken}` },
          },
        );

        return response.data;
      } catch (error) {
        throw new StartInAppPurchaseError({ error });
      }
    },
    [apiClient],
  );
};

export { useStartInAppPurchase };
