import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { DirectCastKeysCache } from '../../../../types';
import { buildDirectCastKeysByAccountFetcher } from './buildDirectCastKeysByAccountFetcher';
import { buildDirectCastKeysByAccountKey } from './buildDirectCastKeysByAccountKey';

const useFetchDirectCastKeysByAccount = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      const response = await buildDirectCastKeysByAccountFetcher({
        apiClient,
        fid,
      })();

      queryClient.setQueryData<DirectCastKeysCache>(
        buildDirectCastKeysByAccountKey({ fid }),
        response,
      );
      return response;
    },
    [queryClient, apiClient],
  );
};
export { useFetchDirectCastKeysByAccount };
