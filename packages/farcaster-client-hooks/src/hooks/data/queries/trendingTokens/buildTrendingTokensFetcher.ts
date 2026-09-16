import {
  ApiGetTrendingTokensQueryParams,
  ApiTokenLink,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedTokens } from '../../../../types';

const buildTrendingTokensFetcher =
  ({
    apiClient,
    params,
    batchMergeIntoGloballyCachedTokens,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetTrendingTokensQueryParams;
    batchMergeIntoGloballyCachedTokens: BatchMergeIntoGloballyCachedTokens;
  }) =>
  async () => {
    const response = await apiClient.getTrendingTokens(params);
    const { result, next } = response.data;
    const tokens: ApiTokenLink[] = [];
    for (const token of result.tokens) {
      tokens.push(token.token);
    }
    batchMergeIntoGloballyCachedTokens({
      batchUpdates: tokens,
    });

    return {
      next,
      tokens: result.tokens || [],
    };
  };

export { buildTrendingTokensFetcher };
