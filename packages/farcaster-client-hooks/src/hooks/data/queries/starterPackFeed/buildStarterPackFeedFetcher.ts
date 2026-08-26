import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildStarterPackFeedFetcher = ({
  id,
  apiClient,
  batchMergeIntoGloballyCachedCasts,
}: {
  id: string;
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getStarterPackFeed({
      cursor,
      id: id,
      limit: 30,
    });

    batchMergeIntoGloballyCachedCasts({
      batchUpdates: response.data.result.casts,
    });

    return response.data;
  });

export { buildStarterPackFeedFetcher };
