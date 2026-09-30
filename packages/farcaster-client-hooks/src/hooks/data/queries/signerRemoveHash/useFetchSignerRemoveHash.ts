import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSignerRemoveHashFetcher } from './buildSignerRemoveHashFetcher';
import { buildSignerRemoveHashKey } from './buildSignerRemoveHashKey';

export const useFetchSignerRemoveHash = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({
      publicKey,
      deadline,
    }: {
      publicKey: string;
      deadline: number;
    }) => {
      const response = await buildSignerRemoveHashFetcher({
        apiClient,
        publicKey,
        deadline,
      })();

      queryClient.setQueryData(
        buildSignerRemoveHashKey({ publicKey, deadline }),
        response,
      );

      return response.result;
    },
    [apiClient, queryClient],
  );
};
