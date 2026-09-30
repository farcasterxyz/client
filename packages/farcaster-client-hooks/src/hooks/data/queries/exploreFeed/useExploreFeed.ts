import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildExploreFeedFetcher } from './buildExploreFeedFetcher';
import { buildExploreFeedKey } from './buildExploreFeedKey';

const useExploreFeed = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildExploreFeedKey(),
    queryFn: buildExploreFeedFetcher({ apiClient }),
  });
};

export { useExploreFeed };
