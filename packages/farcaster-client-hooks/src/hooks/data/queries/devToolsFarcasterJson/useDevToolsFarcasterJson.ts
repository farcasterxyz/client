import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsFarcasterJsonFetcher } from './buildDevToolsFarcasterJsonFetcher';
import { buildDevToolsFarcasterJsonKey } from './buildDevToolsFarcasterJsonKey';

const useDevToolsFarcasterJson = ({
  domain,
  enabled = true,
}: {
  domain: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsFarcasterJsonKey({ domain }),
    queryFn: buildDevToolsFarcasterJsonFetcher({ apiClient, domain }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useDevToolsFarcasterJson };
