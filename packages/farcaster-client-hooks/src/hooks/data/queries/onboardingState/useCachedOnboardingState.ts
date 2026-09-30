import { ApiGetOnboardingState200Response } from 'farcaster-client-data';

import { useFallbackOnboardingState } from './useFallbackOnboardingState';
import { useOnboardingStateWithoutFallback } from './useOnboardingStateWithoutFallback';

const useCachedOnboardingState = (): ApiGetOnboardingState200Response => {
  const fallback = useFallbackOnboardingState();
  const { data } = useOnboardingStateWithoutFallback({
    query: {
      // Hardcoding enabled false makes this a "read only" query
      enabled: false,
      initialData: fallback,
    },
  });

  return data ?? fallback;
};

export { useCachedOnboardingState };
