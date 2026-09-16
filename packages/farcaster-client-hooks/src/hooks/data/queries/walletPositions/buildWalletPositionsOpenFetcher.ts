import {
  ApiGetWalletPositionsOpenQueryParams,
  ApiTokenLink,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedTokens } from '../../../../types';

const buildWalletPositionsOpenFetcher =
  ({
    apiClient,
    batchMergeIntoGloballyCachedTokens,
    params,
  }: {
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedTokens: BatchMergeIntoGloballyCachedTokens;
    params: ApiGetWalletPositionsOpenQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getWalletPositionsOpen(params);
    const { result, next } = response.data;

    const tokens: ApiTokenLink[] = [];
    for (const position of response.data.result.positions) {
      if (position.token && !position.userHidden && !position.hidden) {
        tokens.push(position.token);
      }
    }

    batchMergeIntoGloballyCachedTokens({ batchUpdates: tokens });
    return { next, ...result };
  };

export { buildWalletPositionsOpenFetcher };
