import { useQuery } from '@tanstack/react-query';

import { useTrackEvent } from '../../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildOnboardingStateFetcher } from './buildOnboardingStateFetcher';
import { buildOnboardingStateKey } from './buildOnboardingStateKey';
import { onboardingStateDefaultQueryOptions } from './defaultOnboardingStateQueryOptions';
import { useFallbackOnboardingState } from './useFallbackOnboardingState';

const useOnboardingState = ({ enabled }: { enabled: boolean }) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const { trackEvent } = useTrackEvent();

  const fallback = useFallbackOnboardingState();

  return (
    useQuery({
      ...onboardingStateDefaultQueryOptions,
      queryKey: buildOnboardingStateKey(),
      queryFn: buildOnboardingStateFetcher({
        apiClient,
        mergeIntoGloballyCachedUser,
        trackEvent,
      }),
      enabled,
    }).data || fallback
  );
};

export { useOnboardingState };
