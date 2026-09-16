import { useQuery } from '@tanstack/react-query';

import { buildMiniappsHostedManifestFetcher } from './buildMiniappsHostedManifestFetcher';
import { buildMiniappsHostedManifestKey } from './buildMiniappsHostedManifestKey';

const useMiniappsHostedManifest = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: buildMiniappsHostedManifestKey(id),
    queryFn: buildMiniappsHostedManifestFetcher({ id }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useMiniappsHostedManifest };
