import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSimulateRemoveSignedKeyRequest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      publicKey,
      deadline,
      signature,
    }: {
      publicKey: string;
      deadline: number;
      signature: string;
    }) => {
      const { data } = await apiClient.simulateRemoveSignedKeyRequest({
        publicKey,
        signature,
        deadline,
      });

      return data.result;
    },
    [apiClient],
  );
};

const useRemoveSigner = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      publicKey,
      deadline,
      signature,
    }: {
      publicKey: string;
      deadline: number;
      signature: string;
    }) => {
      const { data } = await apiClient.removeSigner({
        publicKey,
        signature,
        deadline,
      });

      return data.result;
    },
    [apiClient],
  );
};

export { useRemoveSigner, useSimulateRemoveSignedKeyRequest };
