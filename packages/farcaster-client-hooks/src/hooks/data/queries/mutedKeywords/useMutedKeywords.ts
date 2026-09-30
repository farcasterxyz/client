import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildMutedKeywordsFetcher } from './buildMutedKeywordsFetcher';
import { buildMutedKeywordsKey } from './buildMutedKeywordsKey';

const useMutedKeywords = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildMutedKeywordsKey(),
    queryFn: buildMutedKeywordsFetcher({ apiClient }),
  });
};

export { useMutedKeywords };
