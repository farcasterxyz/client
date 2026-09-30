import { FarcasterApiClient } from 'farcaster-client-data';

import { NewsCache } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildNewsFetcher = ({
  apiClient,
  onResponse,
}: {
  apiClient: FarcasterApiClient;
  onResponse: ({ cache }: { cache: NewsCache }) => void;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getNews({
      cursor,
      limit: 15,
    });

    const data = response.data;

    onResponse({ cache: data.result });

    return response.data;
  });

export { buildNewsFetcher };
