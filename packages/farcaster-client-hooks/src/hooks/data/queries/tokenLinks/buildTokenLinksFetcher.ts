import { ApiChain, ApiFid, FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedTokens } from '../../../../types';

const buildTokenLinksFetcher =
  ({
    apiClient,
    ticker,
    chain,
    intent,
    contextFid,
    batchMergeIntoGloballyCachedTokens,
  }: {
    ticker?: string;
    apiClient: FarcasterApiClient;
    chain?: ApiChain;
    intent?: 'typeahead' | 'submit';
    contextFid?: ApiFid;
    batchMergeIntoGloballyCachedTokens: BatchMergeIntoGloballyCachedTokens;
  }) =>
  async () => {
    const response = await apiClient.getTokenLinks({
      ticker,
      chain,
      intent,
      contextFid,
    });

    batchMergeIntoGloballyCachedTokens({
      batchUpdates: response.data.result.tokens,
    });

    return response.data.result;
  };

export { buildTokenLinksFetcher };
