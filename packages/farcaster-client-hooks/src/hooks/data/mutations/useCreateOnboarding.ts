import {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';
import { useInvalidateOnboardingState } from '../queries/onboardingState/useInvalidateOnboardingState';

const useCreateOnboarding = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateOnboardingState = useInvalidateOnboardingState();

  return useCallback(
    async ({
      email,
      account,
      extras,
      version,
    }: {
      email: string;
      account: LocalAccountWithSign;
      extras: unknown;
      version?: 'v2';
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      await apiClient.createOnboarding(
        { authRequest: custodyBearerPayload, email, extras, version: version },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );

      invalidateOnboardingState();
    },
    [apiClient, invalidateOnboardingState],
  );
};

export { useCreateOnboarding };
