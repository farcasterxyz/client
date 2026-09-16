import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildHealthFetcher } from './buildHealthFetcher';
import { buildHealthKey } from './buildHealthKey';

const useHealth = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildHealthKey(),
    queryFn: buildHealthFetcher({ apiClient }),
  });
};

export { useHealth };
