import { useQueryClient } from '@tanstack/react-query';
import { ApiGetOnboardingState200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { OnboardingStateCache } from '../../../../types';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildOnboardingStateKey } from './buildOnboardingStateKey';

export const useSetOnboardingState = () => {
  const queryClient = useQueryClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  return useCallback(
    async (response: ApiGetOnboardingState200Response) => {
      queryClient.setQueryData<OnboardingStateCache>(
        buildOnboardingStateKey(),
        response,
      );

      const user = response.result.state.user;
      if (user) {
        mergeIntoGloballyCachedUser({ updates: user });
      }

      return response;
    },
    [mergeIntoGloballyCachedUser, queryClient],
  );
};
