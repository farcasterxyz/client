import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnboardingInterestCategoriesFetcher =
  ({
    apiClient,
    categories,
  }: {
    apiClient: FarcasterApiClient;
    categories: string;
  }) =>
  async () => {
    const response = await apiClient.getOnboardingInterestCategories({
      categories,
    });

    return response.data;
  };

export { buildOnboardingInterestCategoriesFetcher };
