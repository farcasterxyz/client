import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsGetMiniAppManifestFetcher } from './buildDevToolsGetMiniAppManifestFetcher';
import { buildDevToolsGetMiniAppManifestKey } from './buildDevToolsGetMiniAppManifestKey';

const useDevToolsGetMiniAppManifest = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsGetMiniAppManifestKey({ id }),
    queryFn: buildDevToolsGetMiniAppManifestFetcher({ apiClient, id }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useDevToolsGetMiniAppManifest };
