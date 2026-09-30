import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildBookmarkedCastsFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedCasts,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getBookmarkedCasts({
      cursor,
      limit: 15,
    });

    batchMergeIntoGloballyCachedCasts({
      batchUpdates: response.data.result.bookmarks,
    });

    return response.data;
  });

export { buildBookmarkedCastsFetcher };
