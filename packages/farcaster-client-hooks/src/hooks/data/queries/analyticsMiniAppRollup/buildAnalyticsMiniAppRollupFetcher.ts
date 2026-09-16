import {
  ApiAnalyticsMiniAppRollupRequestBody,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildAnalyticsMiniAppRollupFetcher =
  ({
    apiClient,
    request,
  }: {
    apiClient: FarcasterApiClient;
    request: ApiAnalyticsMiniAppRollupRequestBody;
  }) =>
  async () => {
    const response = await apiClient.analyticsMiniAppRollup(request);
    return response.data.result.rollup;
  };

export { buildAnalyticsMiniAppRollupFetcher };
