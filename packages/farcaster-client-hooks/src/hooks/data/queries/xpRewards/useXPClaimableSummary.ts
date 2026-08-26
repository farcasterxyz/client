import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildXPClaimableSummaryFetcher } from './buildXPClaimableSummaryFetcher';
import { buildXPClaimableSummaryKey } from './buildXPClaimableSummaryKey';

export const useXPClaimableSummary = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildXPClaimableSummaryKey(),
    queryFn: buildXPClaimableSummaryFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

export const useNonSuspenseXPClaimableSummary = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildXPClaimableSummaryKey(),
    queryFn: buildXPClaimableSummaryFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

export const useOptimisticallyUpdateXPClaimableSummary = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildXPClaimableSummaryKey(),
    });
  }, [queryClient]);
};
