import { useQueryClient } from '@tanstack/react-query';
import { ApiGetSignedKeyRequest200Response } from 'farcaster-client-data';
import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';
import type { LocalAccountWithSign } from '../account';
import { buildSignedKeyRequestKey } from '../queries/signedKeyRequest/buildSignedKeyRequestKey';
import { useFetchSignedKeyRequest } from '../queries/signedKeyRequest/useFetchSignedKeyRequest';

export const usePayWarpsAndConnectApp = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const fetchSignedKeyRequest = useFetchSignedKeyRequest();

  return useCallback(
    async (
      {
        warpsOfferingToken,
        token,
      }: {
        warpsOfferingToken: string;
        token: string;
      },
      account: LocalAccountWithSign,
    ) => {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const result = await fetchSignedKeyRequest({ token, deadline });

      const signature = await account.sign({
        hash: result.signedKeyRequest.approveMessageHash as Hex,
      });

      const idempotencyKey = generateIdempotencyKey();

      await apiClient.payWarpsAndConnectApp({
        warpsIdempotencyKey: idempotencyKey,
        warpsOfferingToken: warpsOfferingToken,
        token,
        deadline,
        signature,
      });

      queryClient.setQueryData<ApiGetSignedKeyRequest200Response>(
        buildSignedKeyRequestKey({ token }),
        {
          result: {
            signedKeyRequest: { ...result.signedKeyRequest, state: 'approved' },
          },
        },
      );
    },
    [apiClient, fetchSignedKeyRequest, queryClient],
  );
};
