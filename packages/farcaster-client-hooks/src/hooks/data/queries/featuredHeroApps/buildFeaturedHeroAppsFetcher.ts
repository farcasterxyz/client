import {
  ApiGetFeaturedHeroAppsQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildFeaturedHeroAppsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetFeaturedHeroAppsQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getFeaturedHeroApps(params);
    return response.data.result.apps;
  };

export { buildFeaturedHeroAppsFetcher };
