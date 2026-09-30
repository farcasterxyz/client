import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainActionFetcher } from './buildOnchainActionFetcher';
import { buildOnchainActionKey } from './buildOnchainActionKey';

const useRefreshOnchainAction = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({ onchainActionId }: { onchainActionId: string }) => {
      const response = await buildOnchainActionFetcher({
        apiClient,
        onchainActionId,
      })();

      queryClient.setQueryData(
        buildOnchainActionKey({ onchainActionId }),
        response,
      );

      return response;
    },
    [apiClient, queryClient],
  );
};

export { useRefreshOnchainAction };
