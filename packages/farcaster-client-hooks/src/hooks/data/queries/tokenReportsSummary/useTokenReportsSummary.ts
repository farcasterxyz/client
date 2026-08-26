import { useQuery } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenReportsSummaryFetcher } from './buildTokenReportsSummaryFetcher';
import { buildTokenReportsSummaryKey } from './buildTokenReportsSummaryKey';
import { tokenReportsSummaryDefaultQueryOptions } from './tokenReportsSummaryDefaultQueryOptions';

const useTokenReportsSummary = ({
  chain,
  ca,
  enabled = true,
}: {
  chain: ApiChain;
  ca: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    ...tokenReportsSummaryDefaultQueryOptions,
    queryKey: buildTokenReportsSummaryKey({ chain, ca }),
    queryFn: buildTokenReportsSummaryFetcher({
      apiClient,
      chain,
      ca,
    }),
    enabled,
  });

  return result;
};

export { useTokenReportsSummary };
