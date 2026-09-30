import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildLookupOnboardingStateFetcher } from './buildLookupOnboardingStateFetcher';
import { buildLookupOnboardingStateKey } from './buildLookupOnboardingStateKey';

const useLookupOnboardingState = ({ email }: { email: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildLookupOnboardingStateKey({ email }),
    queryFn: buildLookupOnboardingStateFetcher({ apiClient, email }),
  });
};

export { useLookupOnboardingState };
