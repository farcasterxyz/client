import {
  ApiEthFungibleTokenPosition,
  ApiGetWalletPositions200Response,
  ApiGetWalletPositionsQueryParams,
  ApiTokenLink,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { fetchTokenPriceFromCoingecko } from '../../../../lib/fetchTokenPriceFromCoingecko';
import { BatchMergeIntoGloballyCachedTokens } from '../../../../types';

export type WalletPositionsFetcherData =
  ApiGetWalletPositions200Response['result'];

const HYPEREVM_HYPE_COINGECKO_ID = 'hyperliquid';
const WRAPPED_HYPE_ASSET_ADDRESS = '0x5555555555555555555555555555555555555555';

function getCoingeckoPriceOverrideId(
  position: ApiEthFungibleTokenPosition,
): string | undefined {
  if (position.chain !== 'hyperevm') {
    return undefined;
  }

  const normalizedAddress = position.address?.toLowerCase();
  const isNativeHype =
    !normalizedAddress ||
    normalizedAddress === 'native' ||
    normalizedAddress === '0x0000000000000000000000000000000000000000' ||
    normalizedAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  const isWrappedHype = normalizedAddress === WRAPPED_HYPE_ASSET_ADDRESS;

  return isNativeHype || isWrappedHype ? HYPEREVM_HYPE_COINGECKO_ID : undefined;
}

const buildWalletPositionsFetcher =
  ({
    apiClient,
    batchMergeIntoGloballyCachedTokens,
    params,
  }: {
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedTokens: BatchMergeIntoGloballyCachedTokens;
    params: ApiGetWalletPositionsQueryParams;
  }) =>
  async (): Promise<WalletPositionsFetcherData> => {
    const response = await apiClient.getWalletPositions(params);

    const overrideIdsByPositionId = new Map<string, string>();
    for (const position of response.data.result.positions) {
      const overrideId = getCoingeckoPriceOverrideId(position);
      if (overrideId) {
        overrideIdsByPositionId.set(position.id, overrideId);
      }
    }

    const correctedPricesByOverrideId = new Map<string, number>();
    await Promise.all(
      [...new Set(overrideIdsByPositionId.values())].map(
        async (coingeckoId) => {
          const correctedPrice =
            await fetchTokenPriceFromCoingecko(coingeckoId);
          if (correctedPrice !== undefined) {
            correctedPricesByOverrideId.set(coingeckoId, correctedPrice);
          }
        },
      ),
    );

    const positions = response.data.result.positions.map((position) => {
      const overrideId = overrideIdsByPositionId.get(position.id);
      const correctedPrice =
        overrideId !== undefined
          ? correctedPricesByOverrideId.get(overrideId)
          : undefined;
      if (
        correctedPrice !== undefined &&
        position.quantity?.float !== undefined &&
        position.quantity?.float !== null
      ) {
        const value = position.quantity.float * correctedPrice;
        return {
          ...position,
          price: correctedPrice,
          value,
          token: position.token
            ? {
                ...position.token,
                priceUsd: correctedPrice.toString(),
              }
            : undefined,
        };
      }
      return position;
    });

    const tokens: ApiTokenLink[] = [];
    for (const position of positions) {
      if (position.token && !position.userHidden && !position.hidden) {
        tokens.push(position.token);
      }
    }

    batchMergeIntoGloballyCachedTokens({
      batchUpdates: tokens,
    });

    return {
      ...response.data.result,
      positions,
    };
  };

export { buildWalletPositionsFetcher };
