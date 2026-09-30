import { useQuery } from '@tanstack/react-query';
import { ApiDevToolsDebugDomainManifestQueryParams } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDebugDomainManifestFetcher } from './buildDebugDomainManifestFetcher';
import { buildDebugDomainManifestKey } from './buildDebugDomainManifestKey';

const useDebugDomainManifest = ({
  params,
  enabled,
}: {
  params: ApiDevToolsDebugDomainManifestQueryParams;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDebugDomainManifestKey(params),
    queryFn: buildDebugDomainManifestFetcher({
      apiClient,
      params,
    }),
    enabled,
  });
};

export { useDebugDomainManifest };
