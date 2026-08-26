import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOgFeedItemsFetcher } from './buildOgFeedItemsFetcher';
import { buildOgFeedItemsKey } from './buildOgFeedItemsKey';

const useOgFeedItems = ({ feedKey }: { feedKey: string | undefined }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOgFeedItemsKey({ feedKey: feedKey! }),
    queryFn: buildOgFeedItemsFetcher({ apiClient, feedKey: feedKey! }),
    enabled: typeof feedKey !== 'undefined',
  });
};

export { useOgFeedItems };
