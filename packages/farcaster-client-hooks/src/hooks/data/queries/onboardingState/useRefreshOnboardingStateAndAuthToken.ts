import { useQueryClient } from '@tanstack/react-query';
import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
  DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../../account';
import { buildOnboardingStateAndAuthTokenFetcher } from './buildOnboardingStateAndAuthTokenFetcher';
import { buildOnboardingStateKey } from './buildOnboardingStateKey';

const useRefreshOnboardingStateAndAuthToken = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({
      expiresIn = DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
      account,
    }: {
      expiresIn?: number;
      account: LocalAccountWithSign;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload({ expiresIn });
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      return await queryClient.fetchQuery({
        queryKey: buildOnboardingStateKey(),
        queryFn: buildOnboardingStateAndAuthTokenFetcher({
          apiClient,
          custodyBearerPayload,
          custodyBearerToken,
        }),
        staleTime: 0, // we always want this to refresh the query
      });
    },
    [apiClient, queryClient],
  );
};

export { useRefreshOnboardingStateAndAuthToken };
