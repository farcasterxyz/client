import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsInspectMiniAppUrlFetcher } from './buildDevToolsInspectMiniAppUrlFetcher';
import { buildDevToolsInspectMiniAppUrlKey } from './buildDevToolsInspectMiniAppUrlKey';

const useDevToolsInspectMiniAppUrl = ({
  url,
  enabled = true,
}: {
  url: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsInspectMiniAppUrlKey({ url }),
    queryFn: buildDevToolsInspectMiniAppUrlFetcher({ apiClient, url }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useDevToolsInspectMiniAppUrl };
