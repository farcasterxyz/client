import {
  ApiGetKeyTransactionQueryParams,
  FarcasterApiClient,
  RequestHeaders,
} from 'farcaster-client-data';

const buildKeyTransactionFetcher =
  ({
    apiClient,
    params,
    headers,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetKeyTransactionQueryParams;
    headers?: RequestHeaders;
  }) =>
  async () => {
    const response = await apiClient.getKeyTransaction(params, { headers });
    return response.data;
  };

export { buildKeyTransactionFetcher };
