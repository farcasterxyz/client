import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserAppContextFetcher } from './buildUserAppContextFetcher';
import { buildUserAppContextKey } from './buildUserAppContextKey';
import { userAppContextDefaultQueryOptions } from './userAppContextDefaultQueryOptions';

const useNonSuspenseUserAppContext = (options: {
  refetchOnMount?: boolean | 'always';
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...userAppContextDefaultQueryOptions,
    queryKey: buildUserAppContextKey(),
    queryFn: buildUserAppContextFetcher({ apiClient }),
    ...options,
  });
};

export { useNonSuspenseUserAppContext };
