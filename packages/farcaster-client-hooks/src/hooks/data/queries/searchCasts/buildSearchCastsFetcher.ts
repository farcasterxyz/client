import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';
import { defaultLimit } from './shared';

const buildSearchCastsFetcher = ({
  q,
  limit = defaultLimit,
  apiClient,
  batchMergeIntoGloballyCachedCasts,
}: {
  q: string;
  limit?: number;
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.searchCasts({
      cursor,
      q,
      limit,
    });

    batchMergeIntoGloballyCachedCasts({
      batchUpdates: response.data.result.casts,
    });

    return response.data;
  });

export { buildSearchCastsFetcher };
