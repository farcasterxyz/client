import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserPreferencesFetcher } from './buildUserPreferencesFetcher';
import { buildUserPreferencesKey } from './buildUserPreferencesKey';

const useFetchUserPreferences = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const preferences = await buildUserPreferencesFetcher({ apiClient })();

    queryClient.setQueryData(buildUserPreferencesKey(), preferences);

    return preferences;
  }, [apiClient, queryClient]);
};

export { useFetchUserPreferences };
