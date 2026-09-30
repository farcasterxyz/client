import {
  ApiGetTokenHoldersQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

export type TokenHoldersQueryParams = Omit<
  ApiGetTokenHoldersQueryParams,
  'limit'
> & { limit?: number };

const buildTokenHoldersFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: TokenHoldersQueryParams;
  }) =>
  async () => {
    const { limit = 25 } = params ?? {};
    const response = await apiClient.getTokenHolders({
      ...params,
      limit,
    });

    const { result, next } = response.data;

    return {
      next,
      totalHolders: result.totalHolders,
      items: result.holders ?? [],
    };
  };

export { buildTokenHoldersFetcher };
