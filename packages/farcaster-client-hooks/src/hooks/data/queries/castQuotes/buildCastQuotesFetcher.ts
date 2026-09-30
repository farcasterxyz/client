import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildCastQuotesFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedCasts,
  castHash,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  castHash: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getCastQuotes({
      castHash,
      cursor,
      limit: 15,
    });

    batchMergeIntoGloballyCachedCasts({
      batchUpdates: response.data.result.quotes,
    });

    return response.data;
  });

export { buildCastQuotesFetcher };
