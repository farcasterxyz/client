import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserPreferencesFetcher } from './buildUserPreferencesFetcher';
import { buildUserPreferencesKey } from './buildUserPreferencesKey';
import { userPreferencesDefaultQueryOptions } from './userPreferencesDefaultQueryOptions';

const usePrefetchUserPreferences = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      ...userPreferencesDefaultQueryOptions,
      queryKey: buildUserPreferencesKey(),
      queryFn: buildUserPreferencesFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchUserPreferences };
