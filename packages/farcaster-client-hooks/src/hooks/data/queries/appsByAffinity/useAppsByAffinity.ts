import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { appsByAffinityDefaultQueryOptions } from './appsByAffinityDefaultQueryOptions';
import { buildAppsByAffinityFetcher } from './buildAppsByAffinityFetcher';
import { buildAppsByAffinityKey } from './buildAppsByAffinityKey';

const useAppsByAffinity = ({
  fidOverride,
  limit,
  enabled = true,
}: {
  fidOverride?: number;
  limit?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    ...appsByAffinityDefaultQueryOptions,
    queryKey: buildAppsByAffinityKey({ fidOverride, limit }),
    queryFn: buildAppsByAffinityFetcher({
      apiClient,
      fidOverride,
      limit,
    }),
    enabled,
  });

  return result;
};

export { useAppsByAffinity };
