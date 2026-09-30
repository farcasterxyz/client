import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildShareCastFetcher } from './buildShareCastFetcher';
import { buildShareCastKey } from './buildShareCastKey';

const useFetchShareCast = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ castHash }: { castHash: string }) => {
      const response = await buildShareCastFetcher({ apiClient, castHash })();

      queryClient.setQueriesData(
        { queryKey: buildShareCastKey({ castHash }) },
        response,
      );

      return response;
    },
    [apiClient, queryClient],
  );
};

export { useFetchShareCast };
