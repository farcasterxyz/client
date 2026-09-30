import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnboardingInterestCategoriesKey = ({
  categories,
}: {
  categories: string;
}) => compactQueryKey(['onboardingInterestCategories', categories]);

export { buildOnboardingInterestCategoriesKey };
