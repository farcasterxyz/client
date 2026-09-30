import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildCampaignFetcher } from './buildCampaignFetcher';
import { buildCampaignKey } from './buildCampaignKey';

const useFetchCampaign = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({ id }: { id: string }) => {
      const queryKey = buildCampaignKey({ id });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildCampaignFetcher({
          apiClient,
          id,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { useFetchCampaign };
