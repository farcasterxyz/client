import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenReportsSummaryFetcher } from './buildTokenReportsSummaryFetcher';
import { buildTokenReportsSummaryKey } from './buildTokenReportsSummaryKey';
import { tokenReportsSummaryDefaultQueryOptions } from './tokenReportsSummaryDefaultQueryOptions';

const usePrefetchTokenReportsSummary = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const prefetchTokenReportsSummary = useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      return queryClient.prefetchQuery({
        ...tokenReportsSummaryDefaultQueryOptions,
        queryKey: buildTokenReportsSummaryKey({ chain, ca }),
        queryFn: buildTokenReportsSummaryFetcher({
          apiClient,
          chain,
          ca,
        }),
      });
    },
    [apiClient, queryClient],
  );

  return { prefetchTokenReportsSummary };
};

export { usePrefetchTokenReportsSummary };
