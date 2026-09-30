import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers';
import { buildGetNextNuxTaskFetcher } from './buildGetNextNuxTaskFetcher';
import { buildGetNextNuxTaskKey } from './buildGetNextNuxTaskKey';

const useGetNextNuxTask = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildGetNextNuxTaskKey(),
    queryFn: buildGetNextNuxTaskFetcher({ apiClient }),
    gcTime: 0,
  });
};

export { useGetNextNuxTask };
