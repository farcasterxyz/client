import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAuthSessionsFetcher } from './buildAuthSessionsFetcher';
import { buildAuthSessionsKey } from './buildAuthSessionsKey';

const useAuthSessions = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildAuthSessionsKey(),
    queryFn: buildAuthSessionsFetcher({ apiClient }),
    enabled,
    staleTime: 0, // always treat as stale — force network fetch every time
    gcTime: 60_000, // keep in cache briefly for optimistic updates
    refetchOnMount: 'always', // re-fetch even if data exists in cache
    refetchOnWindowFocus: true,
  });
};

export { useAuthSessions };
