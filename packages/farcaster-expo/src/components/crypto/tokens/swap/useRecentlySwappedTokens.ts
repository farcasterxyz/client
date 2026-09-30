import { ApiOnchainTokenMinimal } from 'farcaster-client-data';
import React from 'react';
import { useMMKVObject } from 'react-native-mmkv';

import {
  formatAssetId,
  isNativeAsset,
  USDC_ADDRESSES,
} from '../../../../utils';

const MAX_RECENTLY_SWAPPED_TOKENS = 5;

type RecentlySwappedToken = {
  id: string;
  timestamp: number;
};
type RecentlySwappedTokens = { tokens: RecentlySwappedToken[] };

export function useRecentlySwappedTokens() {
  const [data, setData] = useMMKVObject<RecentlySwappedTokens>(
    'recently-swapped-tokens',
  );

  const trackRecentlySwappedTokens = React.useCallback(
    (tokens: ApiOnchainTokenMinimal[]) => {
      const currData = data ?? { tokens: [] };

      for (const token of tokens) {
        // Skip native assets and USDC
        if (
          isNativeAsset(token.ca) ||
          USDC_ADDRESSES[token.chain]?.toLowerCase() === token.ca.toLowerCase()
        ) {
          continue;
        }

        // Skip if already in list
        if (
          currData.tokens.some(
            (t) => t.id === formatAssetId(token.chain, token.ca, true),
          )
        ) {
          continue;
        }

        // If at max, shift first item
        if (currData.tokens.length >= MAX_RECENTLY_SWAPPED_TOKENS) {
          currData.tokens.shift();
        }

        currData.tokens.push({
          id: formatAssetId(token.chain, token.ca, true),
          timestamp: Date.now(),
        });
      }

      setData(currData);
    },
    [setData, data],
  );

  return {
    recentlySwappedTokens: data?.tokens ?? [],
    trackRecentlySwappedTokens,
  };
}
