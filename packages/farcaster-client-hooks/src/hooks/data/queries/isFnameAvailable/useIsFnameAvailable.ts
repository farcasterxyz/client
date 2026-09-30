import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildIsFnameAvailableFetcher } from './buildIsFnameAvailableFetcher';
import { buildIsFnameAvailableKey } from './buildIsFnameAvailableKey';

const useIsFnameAvailable = ({ fname }: { fname: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildIsFnameAvailableKey({ fname }),
    queryFn: buildIsFnameAvailableFetcher({ apiClient, fname }),
  });
};

export { useIsFnameAvailable };
