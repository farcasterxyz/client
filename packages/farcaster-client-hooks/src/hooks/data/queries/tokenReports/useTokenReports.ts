import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiChain, getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenReportsFetcher } from './buildTokenReportsFetcher';
import { buildTokenReportsKey } from './buildTokenReportsKey';

const useTokenReports = ({
  chain,
  ca,
  enabled = true,
}: {
  chain: ApiChain;
  ca: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTokenReportsKey({ chain, ca }),
    queryFn: buildTokenReportsFetcher({
      apiClient,
      chain,
      ca,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 1000 * 60,
    enabled,
  });
};

export { useTokenReports };
