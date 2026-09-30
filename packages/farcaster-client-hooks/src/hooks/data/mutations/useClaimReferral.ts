import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useClaimReferral = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid, email }: { fid: number; email: string }) => {
      const { data } = await apiClient.claimReferral({
        fid: fid,
        email: email,
      });

      return data.result;
    },
    [apiClient],
  );
};

export { useClaimReferral };
