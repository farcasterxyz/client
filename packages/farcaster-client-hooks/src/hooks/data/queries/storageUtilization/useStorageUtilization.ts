import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildStorageUtilizationFetcher } from './buildStorageUtilizationFetcher';
import { buildStorageUtilizationKey } from './buildStorageUtilizationKey';

const useStorageUtilization = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildStorageUtilizationKey(),

    queryFn: buildStorageUtilizationFetcher({
      apiClient,
    }),
  });
};

export { useStorageUtilization };
