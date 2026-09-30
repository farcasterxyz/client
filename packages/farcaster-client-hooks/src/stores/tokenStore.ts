import { ApiChain } from 'farcaster-client-data';
import { create } from 'zustand';

type TokenStore = {
  pricesByKey: Record<string, { priceUsd: number; timestamp: number }>;
  upsertPrice: (tokenPrices: {
    chain: ApiChain;
    ca: string;
    priceUsd: number;
    timestamp: number;
  }) => void;
};

function buildTokenKey({ ca, chain }: { ca: string; chain: ApiChain }) {
  return `${chain}:${ca}`;
}

export const useTokenStore = create<TokenStore>()((set) => ({
  pricesByKey: {},
  upsertPrice: (tokenPrice) => {
    set((state) => {
      const key = buildTokenKey(tokenPrice);
      const previousPrice = state.pricesByKey[key];

      if (previousPrice && previousPrice.timestamp > tokenPrice.timestamp) {
        return state;
      }

      const tokenPricesByKey = { ...state.pricesByKey };
      tokenPricesByKey[key] = tokenPrice;

      return { pricesByKey: tokenPricesByKey };
    });
  },
}));

export const useGlobalTokenPrice = (tokenId?: {
  chain: ApiChain;
  ca: string;
}) =>
  useTokenStore((s) =>
    tokenId ? s.pricesByKey[buildTokenKey(tokenId)] : undefined,
  );
