import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTrendingTopicsFetcher } from './buildTrendingTopicsFetcher';
import { buildTrendingTopicsKey } from './buildTrendingTopicsKey';

const useNonSuspenseTrendingTopics = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTrendingTopicsKey(),
    queryFn: buildTrendingTopicsFetcher({ apiClient }),
  });
};

export { useNonSuspenseTrendingTopics };
