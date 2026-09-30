import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildMutedKeywordFetcher } from './buildMutedKeywordFetcher';
import { buildMutedKeywordKey } from './buildMutedKeywordKey';

const useMutedKeyword = ({ keyword }: { keyword: string | undefined }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildMutedKeywordKey({ keyword: keyword! }),
    queryFn: buildMutedKeywordFetcher({ apiClient, keyword: keyword! }),
    enabled: typeof keyword !== 'undefined',
  });
};

export { useMutedKeyword };
