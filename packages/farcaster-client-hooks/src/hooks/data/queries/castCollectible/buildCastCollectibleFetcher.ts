import {
  ApiCast,
  ApiGetCastCollectibleQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { MergeIntoGloballyCachedCast } from '../../../../types';

const buildCastCollectibleFetcher =
  ({
    apiClient,
    params,
    cast,
    mergeIntoGloballyCachedCast,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetCastCollectibleQueryParams;
    cast: ApiCast;
    mergeIntoGloballyCachedCast: MergeIntoGloballyCachedCast;
  }) =>
  async () => {
    const response = await apiClient.getCastCollectible(params);

    mergeIntoGloballyCachedCast({
      updates: {
        hash: cast.hash,
        collectible: response.data.result.collectible,
      },
    });

    return response.data.result.collectible;
  };

export { buildCastCollectibleFetcher };
