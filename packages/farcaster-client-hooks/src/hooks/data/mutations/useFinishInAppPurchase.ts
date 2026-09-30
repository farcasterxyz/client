import {
  ApiOnchainTransactionType,
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { FinishInAppPurchaseError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useFinishInAppPurchase = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      onchainTransactionType,
      productId,
      transactionIdIOS,
      transactionReceiptIOS,
      platform,
      account,
      productPurchaseTrackingId,
    }: {
      onchainTransactionType: ApiOnchainTransactionType;
      productId: string;
      transactionIdIOS: string | undefined;
      transactionReceiptIOS: string;
      platform: 'ios' | 'android';
      account: LocalAccountWithSign;
      productPurchaseTrackingId?: string;
    }) => {
      try {
        const custodyBearerPayload = buildCustodyBearerPayload();
        const custodyBearerToken = await buildCustodyBearerToken({
          payload: custodyBearerPayload,
          account,
        });

        const response = await apiClient.finishInAppPurchaseWithCustody(
          {
            authRequest: custodyBearerPayload,
            onchainTransactionType,
            productId,
            transactionIdIOS,
            transactionReceiptIOS,
            platform,
            productPurchaseTrackingId,
          },
          {
            headers: { Authorization: `Bearer ${custodyBearerToken}` },
          },
        );

        return response.data;
      } catch (error) {
        throw new FinishInAppPurchaseError({ error });
      }
    },
    [apiClient],
  );
};

export { useFinishInAppPurchase };
