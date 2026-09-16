import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTrendingTopicsFetcher } from './buildTrendingTopicsFetcher';
import { buildTrendingTopicsKey } from './buildTrendingTopicsKey';

const useTrendingTopics = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildTrendingTopicsKey(),
    queryFn: buildTrendingTopicsFetcher({ apiClient }),
  });
};

export { useTrendingTopics };
