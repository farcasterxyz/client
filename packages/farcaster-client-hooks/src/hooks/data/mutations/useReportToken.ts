import { ApiChain, ApiReportTokenReason } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useReportToken = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      chain,
      ca,
      reason,
    }: {
      chain: ApiChain;
      ca: string;
      reason: ApiReportTokenReason;
    }) => {
      await apiClient.reportToken({ chain, ca, reason });
    },
    [apiClient],
  );
};

export { useReportToken };
