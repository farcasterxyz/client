import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildClientConfigFetcher } from './buildClientConfigFetcher';
import { buildClientConfigKey } from './buildClientConfigKey';

const useFetchClientConfig = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const response = await queryClient.fetchQuery({
      queryKey: buildClientConfigKey(),
      queryFn: buildClientConfigFetcher({ apiClient }),
    });

    return response.result;
  }, [apiClient, queryClient]);
};

export { useFetchClientConfig };
