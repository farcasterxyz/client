import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetUserPreferences200Response,
  ApiUserPreferences,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildUserPreferencesKey } from '../queries/userPreferences/buildUserPreferencesKey';
import { useInvalidateUserPreferences } from '../queries/userPreferences/useInvalidateUsePreferences';

const useOptimisticSetUserPreferences = () => {
  const queryClient = useQueryClient();

  return useCallback(
    async ({ preferences }: { preferences: Partial<ApiUserPreferences> }) => {
      queryClient.setQueryData(
        buildUserPreferencesKey(),
        (current: ApiGetUserPreferences200Response) => {
          if (!current) {
            return {
              result: {
                preferences: preferences,
              },
            };
          }
          return {
            result: {
              preferences: {
                ...current.result.preferences,
                ...preferences,
              },
            },
          };
        },
      );
    },
    [queryClient],
  );
};

const useSetUserPreferences = (setOptimistically = false) => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUserPreferences = useInvalidateUserPreferences();
  const setOptimisticSetUserPreferences = useOptimisticSetUserPreferences();
  return useCallback(
    async ({ preferences }: { preferences: ApiUserPreferences }) => {
      if (setOptimistically) {
        setOptimisticSetUserPreferences({ preferences });
      }

      const response = await apiClient.setUserPreferences({ preferences });

      invalidateUserPreferences();

      return response.data;
    },
    [
      apiClient,
      invalidateUserPreferences,
      setOptimisticSetUserPreferences,
      setOptimistically,
    ],
  );
};

export { useOptimisticSetUserPreferences, useSetUserPreferences };
