import { useQueryClient } from '@tanstack/react-query';

import { buildOnboardingInterestCategoriesKey } from './buildOnboardingInterestCategoriesKey';

const useInvalidateOnboardingInterestCategories = () => {
  const queryClient = useQueryClient();

  return ({ categories }: { categories: string }) =>
    queryClient.invalidateQueries({
      queryKey: buildOnboardingInterestCategoriesKey({ categories }),
    });
};

export { useInvalidateOnboardingInterestCategories };
