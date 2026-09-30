import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRentStorageOfferingsFetcher } from './buildRentStorageOfferingsFetcher';
import { buildRentStorageOfferingsKey } from './buildRentStorageOfferingsKey';

const useRentStorageOfferings = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildRentStorageOfferingsKey(),
    queryFn: buildRentStorageOfferingsFetcher({ apiClient }),
  });
};

export { useRentStorageOfferings };
