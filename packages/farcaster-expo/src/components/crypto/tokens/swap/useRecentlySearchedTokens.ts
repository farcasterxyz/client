import { ApiOnchainTokenMinimal } from 'farcaster-client-data';
import React from 'react';
import { useMMKVObject } from 'react-native-mmkv';

import {
  formatAssetId,
  isNativeAsset,
  USDC_ADDRESSES,
} from '../../../../utils';

const MAX_RECENTLY_SEARCHED_TOKENS = 5;

export type RecentlySearchedToken = {
  id: string;
  timestamp: number;
};
export type RecentlySearchedTokens = { tokens: RecentlySearchedToken[] };

export function useRecentlySearchedTokens() {
  const [data, setData] = useMMKVObject<RecentlySearchedTokens>(
    'recently-searched-tokens',
  );

  const trackRecentlySearchedTokens = React.useCallback(
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
        if (currData.tokens.length >= MAX_RECENTLY_SEARCHED_TOKENS) {
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

  const removeRecentlySearchedToken = React.useCallback(
    (id: string) => {
      const currData = data ?? { tokens: [] };
      currData.tokens = currData.tokens.filter((t) => t.id !== id);
      setData(currData);
    },
    [setData, data],
  );

  const removeAllRecentlySearchedTokens = React.useCallback(() => {
    setData({ tokens: [] });
  }, [setData]);

  return {
    recentlySearchedTokens: data?.tokens ?? [],
    trackRecentlySearchedTokens,
    removeRecentlySearchedToken,
    removeAllRecentlySearchedTokens,
  };
}
