import { useQueryClient } from '@tanstack/react-query';
import {
  ApiAccountLevel,
  ApiGetOnboardingState200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useMergeIntoGloballyCachedUser } from '../queries/globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildOnboardingStateKey } from '../queries/onboardingState/buildOnboardingStateKey';
import { useCachedOnboardingState } from '../queries/onboardingState/useCachedOnboardingState';

const useSetOnboardingStateUserAccountLevel = () => {
  const queryClient = useQueryClient();
  const key = buildOnboardingStateKey();

  return useCallback(
    (newLevel: ApiAccountLevel | undefined) => {
      queryClient.setQueryData<ApiGetOnboardingState200Response>(
        key,
        (data) => {
          if (!data || !data.result.state.user) {
            return data;
          }

          return {
            ...data,
            result: {
              ...data.result,
              state: {
                ...data.result.state,
                user: {
                  ...data.result.state.user,
                  profile: {
                    ...data.result.state.user?.profile,
                    accountLevel: newLevel,
                  },
                },
              },
            },
          };
        },
      );
    },
    [key, queryClient],
  );
};

const useOptimisticallyUpdateCurrentUserLevel = () => {
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const onboardingState = useCachedOnboardingState();
  const setOnboardingStateUserAccountLevel =
    useSetOnboardingStateUserAccountLevel();

  return useCallback(
    ({ level }: { level: ApiAccountLevel | undefined }) => {
      const fid = onboardingState.result.state.user?.fid;
      if (!fid) {
        return;
      }
      const currentLevel =
        onboardingState.result.state.user?.profile.accountLevel;

      if (currentLevel === level) {
        return;
      }

      setOnboardingStateUserAccountLevel(level);

      mergeIntoGloballyCachedUser({
        updates: {
          fid,
          profile: {
            accountLevel: level,
          },
        },
      });

      // Return revert function
      return () => {
        setOnboardingStateUserAccountLevel(currentLevel);
        mergeIntoGloballyCachedUser({
          updates: {
            fid,
            profile: {
              accountLevel: currentLevel,
            },
          },
        });
      };
    },
    [
      mergeIntoGloballyCachedUser,
      onboardingState.result.state.user?.fid,
      onboardingState.result.state.user?.profile.accountLevel,
      setOnboardingStateUserAccountLevel,
    ],
  );
};

export { useOptimisticallyUpdateCurrentUserLevel };
