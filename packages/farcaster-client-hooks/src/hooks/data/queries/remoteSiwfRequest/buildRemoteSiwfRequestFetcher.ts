import {
  ApiGetRemoteSiwfRequestQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildRemoteSiwfRequestFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetRemoteSiwfRequestQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getRemoteSiwfRequest(params);
    return response.data;
  };

export { buildRemoteSiwfRequestFetcher };
