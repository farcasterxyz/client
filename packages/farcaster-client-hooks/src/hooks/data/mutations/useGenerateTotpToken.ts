import { ApiTotpTokenContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useSetGloballyCachedTotpToken } from '../queries/globallyCachedTotpToken/useSetGloballyCachedTotpToken';

const useGenerateTotpToken = () => {
  const { apiClient } = useFarcasterApiClient();
  const setGloballyCachedTotpToken = useSetGloballyCachedTotpToken();

  return useCallback(
    async ({
      code,
      context,
      email,
    }: {
      code: string;
      context: ApiTotpTokenContext;
      email?: string;
    }) => {
      let token: string;
      if (email) {
        const response = await apiClient.generateTotpTokenForEmail({
          code,
          email,
          context,
        });
        token = response.data.result.token;
      } else {
        const response = await apiClient.generateTotpToken({
          code,
          context,
        });
        token = response.data.result.token;
      }

      // We use a global cache to store the token because the token is needed across
      // screen boundaries and passing value via callback functions doesn't work well
      // when navigating between screens.
      setGloballyCachedTotpToken({ context, token });

      return token;
    },
    [apiClient, setGloballyCachedTotpToken],
  );
};

export { useGenerateTotpToken };
