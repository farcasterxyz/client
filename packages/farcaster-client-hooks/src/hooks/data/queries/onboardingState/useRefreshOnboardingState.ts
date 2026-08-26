import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildOnboardingStateFetcher } from './buildOnboardingStateFetcher';
import { buildOnboardingStateKey } from './buildOnboardingStateKey';

const useRefreshOnboardingState = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async (options?: Partial<{ retry: number }>) => {
      return await queryClient.fetchQuery({
        queryKey: buildOnboardingStateKey(),
        queryFn: buildOnboardingStateFetcher({
          apiClient,
          mergeIntoGloballyCachedUser,
          trackEvent,
        }),
        staleTime: 0, // we always want this to refresh the query
        ...options,
      });
    },
    [apiClient, queryClient, mergeIntoGloballyCachedUser, trackEvent],
  );
};

export { useRefreshOnboardingState };
