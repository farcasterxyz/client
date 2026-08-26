import { ApiAppsSortBy, FarcasterApiClient } from 'farcaster-client-data';

const buildAppsByCategoryFetcher =
  ({
    apiClient,
    category,
    sortByKey,
    limit,
  }: {
    apiClient: FarcasterApiClient;
    category: string;
    sortByKey: ApiAppsSortBy;
    limit?: number;
  }) =>
  async () => {
    const response = await apiClient.getAppsByCategory({
      category,
      sortByKey,
      limit,
    });
    return response.data;
  };

export { buildAppsByCategoryFetcher };
