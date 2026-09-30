import {
  ApiCast,
  CastHashPrefix,
  FarcasterApiClient,
} from 'farcaster-client-data';

import {
  BatchMergeIntoGloballyCachedCasts,
  CastUpdates,
} from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildUserThreadCastsFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedCasts,
  castHashPrefix,
  username,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  castHashPrefix: CastHashPrefix;
  username: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getUserThreadCasts({
      castHashPrefix,
      cursor,
      // API endpoint is case-sensitive and won't accept
      // uppercased usernames as they are technically invalid
      // at the protocol layer.
      username: username.toLowerCase(),
      limit: 15,
    });

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

export { buildUserThreadCastsFetcher };
