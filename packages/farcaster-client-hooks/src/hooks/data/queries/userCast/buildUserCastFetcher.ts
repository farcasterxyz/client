import { CastHashPrefix, FarcasterApiClient } from 'farcaster-client-data';

import { MergeIntoGloballyCachedCast } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildUserCastFetcher = ({
  apiClient,
  mergeIntoGloballyCachedCast,
  hashPrefix,
  username,
}: {
  apiClient: FarcasterApiClient;
  mergeIntoGloballyCachedCast: MergeIntoGloballyCachedCast;
  hashPrefix: CastHashPrefix;
  username: string;
}) =>
  wrapPaginatedFetcher(async () => {
    const response = await apiClient.getUserCast({
      username,
      hashPrefix,
    });

    // Populate the cast cache in addition to this specific query cache
    mergeIntoGloballyCachedCast({
      updates: response.data.result.cast,
    });

    return response.data;
  });

export { buildUserCastFetcher };
