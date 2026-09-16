import { ApiCast, FarcasterApiClient } from 'farcaster-client-data';

import {
  BatchMergeIntoGloballyCachedCasts,
  CastUpdates,
} from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildThreadFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedCasts,
  castHash,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  castHash: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getThread({
      castHash,
      cursor,
      limit: 15,
    });

    // Populate the cast cache in addition to this specific query cache
    const batchUpdates: CastUpdates[] = [];

    const alreadyAddedToGlobalCache = new Set<string>();

    function collect(cast: ApiCast) {
      if (!cast || alreadyAddedToGlobalCache.has(cast.hash)) return;

      alreadyAddedToGlobalCache.add(cast.hash);
      batchUpdates.push(cast);

      cast.ancestors?.casts?.forEach(collect);

      cast.replies?.casts?.forEach(collect);
    }

    response.data.result.casts.forEach(collect);

    batchMergeIntoGloballyCachedCasts({ batchUpdates });

    return response.data;
  });

export { buildThreadFetcher };
