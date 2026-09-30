import { useQueryClient } from '@tanstack/react-query';
import { ApiGetSignedKeyRequest200Response } from 'farcaster-client-data';
import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';
import { buildSignedKeyRequestKey } from '../queries/signedKeyRequest/buildSignedKeyRequestKey';
import { useFetchSignedKeyRequest } from '../queries/signedKeyRequest/useFetchSignedKeyRequest';

const useSimulateCreateSignedKeyRequest = () => {
  const { apiClient } = useFarcasterApiClient();
  const fetchSignedKeyRequest = useFetchSignedKeyRequest();

  return useCallback(
    async ({ token }: { token: string }, wallet: LocalAccountWithSign) => {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      const result = await fetchSignedKeyRequest({ token, deadline });

      const signature = await wallet.sign({
        hash: result.signedKeyRequest.approveMessageHash as Hex,
      });

      await apiClient.simulateCreateSignedKeyRequest({
        token,
        deadline,
        signature,
      });
    },
    [apiClient, fetchSignedKeyRequest],
  );
};

const useApproveSignedKeyRequest = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const fetchSignedKeyRequest = useFetchSignedKeyRequest();

  return useCallback(
    async (
      {
        token,
        paymentMethod,
      }: {
        token: string;
        paymentMethod: { type: 'iap' } | { type: 'sponsored' };
      },
      wallet: LocalAccountWithSign,
    ) => {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      const result = await fetchSignedKeyRequest({ token, deadline });

      const signature = await wallet.sign({
        hash: result.signedKeyRequest.approveMessageHash as Hex,
      });

      await apiClient.approveSignedKeyRequest({
        token,
        deadline,
        signature,
        paymentMethod,
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
    [apiClient, queryClient, fetchSignedKeyRequest],
  );
};

export { useApproveSignedKeyRequest, useSimulateCreateSignedKeyRequest };
