import { DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN } from 'farcaster-client-data';
import { useCallback } from 'react';

import type { LocalAccountWithSign } from '../../account';
import { useRefreshOnboardingStateAndAuthToken } from './useRefreshOnboardingStateAndAuthToken';

const useRefreshOnboardingStateBeforeUserHasFid = () => {
  const refreshOnboardingStateAndAuthToken =
    useRefreshOnboardingStateAndAuthToken();

  return useCallback(
    async ({
      expiresIn = DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
      account,
    }: {
      expiresIn?: number;
      account: LocalAccountWithSign;
    }) => {
      const response = await refreshOnboardingStateAndAuthToken({
        expiresIn,
        account,
      });

      return response;
    },
    [refreshOnboardingStateAndAuthToken],
  );
};

export { useRefreshOnboardingStateBeforeUserHasFid };
