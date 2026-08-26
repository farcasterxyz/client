import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { authenticatedUserDefaultQueryOptions } from './authenticatedUserDefaultQueryOptions';
import { buildAuthenticatedUserFetcher } from './buildAuthenticatedUserFetcher';
import { buildAuthenticatedUserKey } from './buildAuthenticatedUserKey';

const useAuthenticatedUser = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...authenticatedUserDefaultQueryOptions,
    queryKey: buildAuthenticatedUserKey(),
    queryFn: buildAuthenticatedUserFetcher({ apiClient }),
    enabled,
  });
};

export { useAuthenticatedUser };
