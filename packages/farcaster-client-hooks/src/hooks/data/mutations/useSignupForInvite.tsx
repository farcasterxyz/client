import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSignupForInvite = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      email,
      inviterFid,
      identifier,
    }: {
      email: string;
      inviterFid: number;
      identifier: string;
    }) => {
      await apiClient.signupForInvite({ email, inviterFid, identifier });
    },
    [apiClient],
  );
};

export { useSignupForInvite };
