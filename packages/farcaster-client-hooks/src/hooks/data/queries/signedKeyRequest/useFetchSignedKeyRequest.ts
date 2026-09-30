import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSignedKeyRequestFetcher } from './buildSignedKeyRequestFetcher';
import { buildSignedKeyRequestKey } from './buildSignedKeyRequestKey';

export const useFetchSignedKeyRequest = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({ token, deadline }: { token: string; deadline?: number }) => {
      const response = await buildSignedKeyRequestFetcher({
        apiClient,
        token,
        deadline,
      })();

      queryClient.setQueryData(
        buildSignedKeyRequestKey({ token, deadline }),
        response,
      );

      return response.result;
    },
    [apiClient, queryClient],
  );
};
