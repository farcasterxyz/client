import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAccountVerificationsFetcher } from './buildAccountVerificationsFetcher';
import { buildAccountVerificationsKey } from './buildAccountVerificationsKey';

const useAccountVerifications = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildAccountVerificationsKey(),
    queryFn: buildAccountVerificationsFetcher({ apiClient }),
    staleTime: 0,
    gcTime: 0,
  });
};

export { useAccountVerifications as useAccountVerificationsV1 };
