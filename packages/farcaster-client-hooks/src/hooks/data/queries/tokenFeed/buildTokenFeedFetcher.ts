import {
  ApiGetTokenEmbedFeedQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildTokenFeedFetcher = ({
  apiClient,
  params,
  limit = 15,
}: {
  apiClient: FarcasterApiClient;
  params: Omit<ApiGetTokenEmbedFeedQueryParams, 'limit'>;
  limit?: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTokenEmbedFeed({
      chain: params.chain,
      ca: params.ca,
      feedType: params.feedType,
      cursor,
      limit,
    });

    return response.data;
  });

export { buildTokenFeedFetcher };
