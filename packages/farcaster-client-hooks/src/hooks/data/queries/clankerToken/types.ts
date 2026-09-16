// Local types for the clanker token hook.
//
// The `/api/clanker/token` endpoint is served by the Next.js ssr app
// (apps/farcaster-ssr/src/pages/api/clanker/token.ts), which proxies
// clanker.world to keep the API key server-side. It has never been part of
// the backend schema, so `make sync-api` does not generate these types.
//
// Prior to NEYN-10453, the types lived in packages/farcaster-client-data/src/types/api.ts
// as hand-edits that got clobbered on every regen. Colocated here now so
// the sync script can't touch them.

export type ApiClankerTokenType = 'clanker_v3' | 'clanker_v3_1' | 'clanker_v4';

export type ApiClankerTokenWarning = {
  type?: string;
  message?: string;
};

export type ApiClankerTokenFees = {
  type?: 'static' | 'dynamic';
  clankerFee?: number;
  pairedFee?: number;
  hookAddress?: string;
  recipients?: Array<{
    bps?: number;
    admin?: string;
    recipient?: string;
  }>;
};

export type ApiClankerTokenLockup = {
  startedAt?: number;
  lockDuration?: number;
  vestDuration?: number;
};

export type ApiClankerTokenVault = {
  amount?: string;
  lockup?: ApiClankerTokenLockup;
};

export type ApiClankerTokenDevBuy = {
  amountEth?: string;
};

export type ApiClankerTokenAirdrop = {
  amount?: string;
  lockup?: ApiClankerTokenLockup;
};

export type ApiClankerTokenSniperTax = {
  startingFee?: number;
  endingFee?: number;
  secondsToDecay?: string;
};

export type ApiClankerTokenPosition = {
  tickLower?: number;
  tickUpper?: number;
  positionBps?: number;
};

export type ApiClankerTokenExtensions = {
  fees?: ApiClankerTokenFees;
  vault?: ApiClankerTokenVault;
  airdrop?: ApiClankerTokenAirdrop;
  devBuy?: ApiClankerTokenDevBuy;
  sniperTax?: ApiClankerTokenSniperTax;
  positions?: ApiClankerTokenPosition[];
};

export type ApiClankerTokenSocialContext = {
  platform?: string;
  messageId?: string;
  interface?: string;
};

export type ApiClankerTokenMarket = {
  startingMarketCap?: number;
};

export type ApiClankerToken = {
  id?: number;
  createdAt?: string;
  lastIndexed?: string;
  contractAddress: string;
  name: string;
  symbol: string;
  description?: string;
  socialLinks?: Array<{ name?: string; link?: string }>;
  imgUrl?: string;
  type?: ApiClankerTokenType;
  pair?: string;
  chainId?: number;
  deployedAt?: string;
  poolAddress?: string;
  lockerAddress?: string;
  admin?: string;
  tags?: {
    champagne?: boolean;
    verified?: boolean;
  };
  supply?: string;
  warnings?: ApiClankerTokenWarning[];
  extensions?: ApiClankerTokenExtensions;
  socialContext?: ApiClankerTokenSocialContext;
  metadata?:
    | {
        description?: string;
        socialMediaUrls?: Array<{
          platform: string;
          url: string;
        }>;
      }
    | Record<string, unknown>;
  market?: ApiClankerTokenMarket;
  twitterUrl?: string | null;
  farcasterUrl?: string | null;
};

export type ApiGetClankerTokenQueryParams = {
  ca: string;
};

export type ApiGetClankerToken200Response = {
  result: ApiClankerToken;
};
