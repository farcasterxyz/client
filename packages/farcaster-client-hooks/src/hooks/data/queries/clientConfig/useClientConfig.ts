import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildClientConfigFetcher } from './buildClientConfigFetcher';
import { buildClientConfigKey } from './buildClientConfigKey';
import { clientConfigDefaultQueryOptions } from './clientConfigDefaultQueryOptions';

export const useClientConfig = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    ...clientConfigDefaultQueryOptions,
    queryKey: buildClientConfigKey(),
    queryFn: buildClientConfigFetcher({ apiClient }),
  });
};

export const useClientConfigNonSuspense = ({
  enabled,
}: Partial<{ enabled: boolean }> = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...clientConfigDefaultQueryOptions,
    queryKey: buildClientConfigKey(),
    queryFn: buildClientConfigFetcher({ apiClient }),
    enabled,
  });
};
