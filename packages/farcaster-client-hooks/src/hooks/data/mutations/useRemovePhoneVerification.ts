import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useRemovePhoneVerification = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (fid: number) => {
      const { data } = await apiClient.removePhoneVerificationForUser({
        fid,
      });
      return data.result;
    },

    [apiClient],
  );
};
