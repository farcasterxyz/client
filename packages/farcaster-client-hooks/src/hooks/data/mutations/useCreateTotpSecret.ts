import { useQuery } from '@tanstack/react-query';

import { MILLIS_PER_MINUTE } from '../../..';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const TOTP_SECRET_KEY = ['totpSecret'];

const useCreateTotpSecret = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: TOTP_SECRET_KEY,
    queryFn: async () => {
      const response = await apiClient.createTotpSecret();
      return response.data.result;
    },
    staleTime: 2 * MILLIS_PER_MINUTE,
    gcTime: 2 * MILLIS_PER_MINUTE,
    retry: 0,
  });
};

export { useCreateTotpSecret };
