import {
  ApiGetTokenQueryParamsCamelCase,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { useTokenStore } from '../../../../stores/tokenStore';
import { MergeIntoGloballyCachedToken } from '../../../../types';

const buildTokenFetcher =
  ({
    apiClient,
    params,
    mergeIntoGloballyCachedToken,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetTokenQueryParamsCamelCase;
    mergeIntoGloballyCachedToken?: MergeIntoGloballyCachedToken;
  }) =>
  async () => {
    const response = await apiClient.getToken(params);

    if (response.data.result.token) {
      mergeIntoGloballyCachedToken?.({
        updates: response.data.result.token,
      });

      if (
        response.data.result.token.priceUsd &&
        response.data.result.token.priceUpdatedAt
      ) {
        useTokenStore.getState().upsertPrice({
          ca: params.ca,
          chain: params.chain,
          priceUsd: Number(response.data.result.token.priceUsd),
          timestamp: response.data.result.token.priceUpdatedAt,
        });
      }
    }

    return response.data.result;
  };

export { buildTokenFetcher };
