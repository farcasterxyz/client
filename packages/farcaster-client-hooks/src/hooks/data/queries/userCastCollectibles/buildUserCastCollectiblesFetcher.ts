import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';

const buildUserCastCollectiblesFetcher =
  ({
    apiClient,
    fid,
    batchMergeIntoGloballyCachedCasts,
  }: {
    apiClient: FarcasterApiClient;
    fid: number;
    batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  }) =>
  async () => {
    const response = await apiClient.getUserCastCollectibles({
      fid,
    });

    const casts = [...response.data.result.owned, ...response.data.result.bids];

    batchMergeIntoGloballyCachedCasts({
      batchUpdates: casts,
    });

    return response.data.result;
  };

export { buildUserCastCollectiblesFetcher };
