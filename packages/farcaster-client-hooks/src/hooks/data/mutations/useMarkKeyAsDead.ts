import { ApiMarkDirectCastKeyAsDeadRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useMarkKeyAsDead = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (body: ApiMarkDirectCastKeyAsDeadRequestBody) => {
      await apiClient.markDirectCastKeyAsDead(body);
    },
    [apiClient],
  );
};

export { useMarkKeyAsDead };
