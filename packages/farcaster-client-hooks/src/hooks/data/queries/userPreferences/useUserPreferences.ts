import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserPreferencesFetcher } from './buildUserPreferencesFetcher';
import { buildUserPreferencesKey } from './buildUserPreferencesKey';
import { userPreferencesDefaultQueryOptions } from './userPreferencesDefaultQueryOptions';

const useUserPreferences = (
  { staleTime = 0 }: { staleTime?: number } = {
    staleTime: 0,
  },
) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    ...userPreferencesDefaultQueryOptions,
    queryKey: buildUserPreferencesKey(),
    queryFn: buildUserPreferencesFetcher({ apiClient }),
    staleTime,
  });
};

const useNonSuspenseUserPreferences = (
  {
    staleTime = 0,
    enabled = true,
  }: {
    staleTime?: number;
    enabled?: boolean;
  } = {
    staleTime: 0,
    enabled: true,
  },
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...userPreferencesDefaultQueryOptions,
    queryKey: buildUserPreferencesKey(),
    queryFn: buildUserPreferencesFetcher({ apiClient }),
    staleTime,
    enabled,
  });
};

export { useNonSuspenseUserPreferences, useUserPreferences };
