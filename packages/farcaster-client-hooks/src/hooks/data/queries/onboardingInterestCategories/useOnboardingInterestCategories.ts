import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnboardingInterestCategoriesFetcher } from './buildOnboardingInterestCategoriesFetcher';
import { buildOnboardingInterestCategoriesKey } from './buildOnboardingInterestCategoriesKey';

const useOnboardingInterestCategories = ({
  categories,
}: {
  categories: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildOnboardingInterestCategoriesKey({ categories }),
    queryFn: buildOnboardingInterestCategoriesFetcher({
      apiClient,
      categories,
    }),
  });
};

const usePrefetchOnboardingInterestCategories = ({
  categories,
}: {
  categories: string;
}) => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    () =>
      queryClient.prefetchQuery({
        queryKey: buildOnboardingInterestCategoriesKey({ categories }),
        queryFn: buildOnboardingInterestCategoriesFetcher({
          apiClient,
          categories,
        }),
      }),
    [apiClient, categories, queryClient],
  );
};

export {
  useOnboardingInterestCategories,
  usePrefetchOnboardingInterestCategories,
};
