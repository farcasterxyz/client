import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  buildXPQuickViewFetcher,
  type XPQuickViewResult,
} from './buildXPQuickViewFetcher';
import { buildXPQuickViewKey } from './buildXPQuickViewKey';

export const useXPQuickView = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery<XPQuickViewResult>({
    queryKey: buildXPQuickViewKey(),
    queryFn: buildXPQuickViewFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseXPQuickView = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<XPQuickViewResult>({
    queryKey: buildXPQuickViewKey(),
    queryFn: buildXPQuickViewFetcher({ apiClient }),
  });
};
