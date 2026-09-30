import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTotpEnabledFetcher } from './buildTotpEnabledFetcher';
import { buildTotpEnabledKey } from './buildTotpEnabledKey';

const useTotpEnabledQuery = ({
  email,
  enabled = true,
}: {
  email?: string;
  enabled?: boolean;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTotpEnabledKey({ email }),
    queryFn: buildTotpEnabledFetcher({ apiClient, email }),
    enabled,
  });
};

export { useTotpEnabledQuery };
