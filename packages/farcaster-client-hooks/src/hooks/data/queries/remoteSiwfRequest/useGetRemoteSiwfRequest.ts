import { useQueryClient } from '@tanstack/react-query';
import { ApiGetRemoteSiwfRequestQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRemoteSiwfRequestFetcher } from './buildRemoteSiwfRequestFetcher';
import { buildRemoteSiwfRequestKey } from './buildRemoteSiwfRequestKey';

export const useGetRemoteSiwfRequest = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async (params: ApiGetRemoteSiwfRequestQueryParams) => {
      const response = await buildRemoteSiwfRequestFetcher({
        apiClient,
        params,
      })();

      queryClient.setQueryData(buildRemoteSiwfRequestKey(params), response);

      return response.result;
    },
    [apiClient, queryClient],
  );
};
