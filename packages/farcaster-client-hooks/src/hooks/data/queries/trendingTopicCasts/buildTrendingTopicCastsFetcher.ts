import {
  ApiTrendingTopicCastsSort,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildTrendingTopicCastsFetcher = ({
  apiClient,
  topicId,
  sort,
}: {
  apiClient: FarcasterApiClient;
  topicId: string;
  sort: ApiTrendingTopicCastsSort;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTrendingTopicCasts({
      topicId,
      sort,
      cursor,
      limit: 15,
    });

    return response.data;
  });

export { buildTrendingTopicCastsFetcher };
