import {
  ApiGetConnectedAppQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildConnectedAppFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetConnectedAppQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getConnectedApp(params);
    return response.data.result;
  };

export { buildConnectedAppFetcher };
