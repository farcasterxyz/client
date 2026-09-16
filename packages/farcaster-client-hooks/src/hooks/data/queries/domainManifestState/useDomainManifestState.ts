import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDomainManifestStateFetcher } from './buildDomainManifestStateFetcher';
import { buildDomainManifestStateKey } from './buildDomainManifestStateKey';

export const useDomainManifestState = ({
  domain,
  manifest,
  enabled,
}: {
  domain?: string;
  manifest?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDomainManifestStateKey({ domain, manifest }),
    queryFn: buildDomainManifestStateFetcher({
      apiClient,
      domain,
      manifest,
    }),
    enabled,
  });
};
