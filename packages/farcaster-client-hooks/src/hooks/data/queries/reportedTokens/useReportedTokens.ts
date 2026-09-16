import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildReportedTokensFetcher } from './buildReportedTokensFetcher';
import { buildReportedTokensKey } from './buildReportedTokensKey';

const useReportedTokens = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildReportedTokensKey(),
    queryFn: buildReportedTokensFetcher({
      apiClient,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 1000 * 60,
    enabled,
  });
};

export { useReportedTokens };
