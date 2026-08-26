import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildCampaignFetcher } from './buildCampaignFetcher';
import { buildCampaignKey } from './buildCampaignKey';

const useCampaign = ({ id }: { id: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildCampaignKey({ id }),
    queryFn: buildCampaignFetcher({ apiClient, id }),
    refetchOnMount: 'always',
    retry: true,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export { useCampaign };
