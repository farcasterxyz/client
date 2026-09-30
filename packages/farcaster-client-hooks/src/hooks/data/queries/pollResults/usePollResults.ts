import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPollResultsFetcher } from './buildPollResultsFetcher';
import { buildPollResultsKey } from './buildPollResultsKey';

const usePollResults = (url: string) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildPollResultsKey({ url }),
    queryFn: buildPollResultsFetcher({ apiClient, url }),
  });
};

export { usePollResults };
