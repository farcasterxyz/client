import {
  ApiChain,
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  ApiOnchainTokenMinimal,
  ApiTokenLink,
  chainIdToChain,
  CHAINS,
  isUsdc,
} from 'farcaster-client-data';
import { formatUnits, isAddress as isEvmAddress, zeroAddress } from 'viem';

import { isSolanaAddress } from './SolanaUtils';

export const EIP7528_NATIVE_ASSET_ADDRESS =
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const SOLANA_NATIVE_ASSET_ADDRESS = '11111111111111111111111111111111';

export const WRAPPED_SOLANA_ASSET_ADDRESS =
  'So11111111111111111111111111111111111111112';

// Caches for expensive computations - cache static properties only
const tokenPositionStaticCache = new Map<
  string,
  {
    chain: ApiChain;
    ca: string;
    name: string;
    symbol: string;
    decimals: number;
    imageUrl: string;
  }
>();
const tokenLinkStaticCache = new Map<
  string,
  {
    chain: ApiChain;
    ca: string;
    name: string;
    symbol: string;
    decimals: number;
    imageUrl: string;
  }
>();
const tokenPositionToLinkStaticCache = new Map<
  string,
  {
    chain: ApiChain;
    ca: string;
    name: string;
    ticker: string;
    decimals: number;
    imageUrl: string;
  }
>();
const isNativeAssetCache = new Map<string, boolean>();

const ZERO_ADDRESS_LOWER = zeroAddress.toLowerCase();
const EIP7528_NATIVE_ADDRESS_LOWER = EIP7528_NATIVE_ASSET_ADDRESS.toLowerCase();
const SOLANA_NATIVE_ADDRESS_LOWER = SOLANA_NATIVE_ASSET_ADDRESS.toLowerCase();

export const USDC_ADDRESSES = Object.values(CHAINS).reduce(
  (acc, chain) => {
    if (chain.usdcAddress) {
      acc[chain.id] = chain.usdcAddress;
    }
    return acc;
  },
  {} as Record<ApiChain, string>,
);

export const NATIVE_ETH_CHAINS: ApiChain[] = [
  'ethereum',
  'base',
  'zora',
  'optimism',
  'arbitrum',
  'base-sepolia',
  'abstract',
  'unichain',
  'robinhood',
];

export const NATIVE_ASSET_SYMBOLS: Record<ApiChain, string> = {
  ethereum: 'ETH',
  base: 'ETH',
  zora: 'ETH',
  optimism: 'ETH',
  arbitrum: 'ETH',
  'base-sepolia': 'ETH',
  abstract: 'ETH',
  unichain: 'ETH',
  solana: 'SOL',
  polygon: 'MATIC',
  degen: 'DEGEN',
  gnosis: 'XDAI',
  'monad-testnet': 'MON',
  monad: 'MON',
  celo: 'CELO',
  hyperevm: 'HYPE',
  bsc: 'BNB',
  robinhood: 'ETH',
};

export const isNativeAsset = (ca?: string) => {
  if (!ca || ca === 'native') {
    return true;
  }

  const cached = isNativeAssetCache.get(ca);
  if (cached !== undefined) {
    return cached;
  }

  const caLower = ca.toLowerCase();
  const result =
    caLower === ZERO_ADDRESS_LOWER ||
    caLower === EIP7528_NATIVE_ADDRESS_LOWER ||
    caLower === SOLANA_NATIVE_ADDRESS_LOWER ||
    caLower === 'native';

  isNativeAssetCache.set(ca, result);
  return result;
};

export function normalizeAssetId(
  chain: ApiChain,
  ca?: string,
): { chain: ApiChain; ca: string } {
  return { chain, ca: formatTokenAddress(chain, ca) };
}

export function formatAssetId(chain: ApiChain, ca?: string, lowerCase = false) {
  // Never lowercase solana addresses
  if (chain === 'solana') {
    lowerCase = false;
  }

  const formatted = `${chain}:${isNativeAsset(ca) ? 'native' : ca}`;
  return lowerCase ? formatted.toLowerCase() : formatted;
}

export function parseAssetId(assetId: string) {
  const [chain, ca] = assetId.split(':');
  return normalizeAssetId(chain as ApiChain, ca);
}

export const isSameAsset = ({
  chain,
  ca,
  asset,
}: {
  chain: ApiChain;
  ca?: string;
  asset: { chain: ApiChain; ca?: string };
}) => {
  if (chain !== asset.chain) {
    return false;
  }

  if (isNativeAsset(ca) && isNativeAsset(asset.ca)) {
    return true;
  }

  return ca?.toLowerCase() === asset.ca?.toLowerCase();
};

export const formatTokenAddress = (chain: ApiChain, ca?: string) => {
  if (!ca || isNativeAsset(ca)) {
    return chain === 'solana'
      ? SOLANA_NATIVE_ASSET_ADDRESS
      : EIP7528_NATIVE_ASSET_ADDRESS;
  }

  return ca;
};

export const formatTokenDecimals = (chain: ApiChain, decimals?: number) => {
  if (!decimals) {
    return chain === 'solana' ? 9 : 18;
  }

  return decimals;
};

export const tokenLinkToMinimalToken = (
  token: ApiTokenLink,
): ApiOnchainTokenMinimal => {
  // Create cache key for static properties
  const staticCacheKey = `${token.chain}:${token.ca}:${token.name}:${token.ticker}`;
  const staticCached = tokenLinkStaticCache.get(staticCacheKey);

  const staticProps = staticCached || {
    chain: token.chain,
    ca: formatTokenAddress(token.chain, token.ca),
    name: token.name,
    symbol: token.ticker,
    decimals: formatTokenDecimals(token.chain, token.decimals),
    imageUrl: token.imageUrl,
  };

  if (!staticCached) {
    tokenLinkStaticCache.set(staticCacheKey, staticProps);
  }

  // Always recompute dynamic price data
  return {
    ...staticProps,
    priceUsd: token.priceUsd ? Number(token.priceUsd) : 0,
    marketCap: token.marketCap ?? 0,
  };
};

export const tokenPositionToMinimalToken = (
  token: ApiEthFungibleTokenPosition,
): ApiOnchainTokenMinimal => {
  // Create cache key for static properties
  const staticCacheKey = `${token.chain}:${token.address}:${token.name}:${token.symbol}`;
  const staticCached = tokenPositionStaticCache.get(staticCacheKey);

  const staticProps = staticCached || {
    chain: token.chain,
    ca: formatTokenAddress(token.chain, token.address),
    name: token.name ?? '',
    symbol: token.symbol ?? '',
    decimals: formatTokenDecimals(token.chain, token.decimals),
    imageUrl: token.iconUrl ?? '',
  };

  if (!staticCached) {
    tokenPositionStaticCache.set(staticCacheKey, staticProps);
  }

  // Always recompute dynamic price data
  return {
    ...staticProps,
    priceUsd: token.price ? Number(token.price) : 0,
    marketCap: token.marketCap ?? 0,
  };
};

export const tokenPositionToTokenLink = (
  token: ApiEthFungibleTokenPosition,
): ApiTokenLink => {
  // Create cache key for static properties
  const staticCacheKey = `${token.chain}:${token.address}:${token.name}:${token.symbol}`;
  const staticCached = tokenPositionToLinkStaticCache.get(staticCacheKey);

  const staticProps = staticCached || {
    chain: token.chain,
    ca: formatTokenAddress(token.chain, token.address),
    name: token.name ?? '',
    ticker: token.symbol ?? '',
    decimals: formatTokenDecimals(token.chain, token.decimals),
    imageUrl: token.iconUrl ?? '',
    marketCap: token.marketCap,
  };

  if (!staticCached) {
    tokenPositionToLinkStaticCache.set(staticCacheKey, staticProps);
  }

  // Always recompute dynamic price data and price changes
  return {
    ...staticProps,
    features: {
      ...(token.features ?? {}),
      ...(token.token?.features ?? {}),
    },
    priceUsd: token.price ? token.price.toString() : undefined,
    priceChangePct: {
      h6: token.percent1d,
      h24: token.percent1d,
    },
    walletContext: {
      position: {
        quantity: {
          float: token.quantity.float,
          int: token.quantity.int,
        },
        valueUsd: token.value ?? 0,
      },
    },
    // Preserve source fields needed for badges/display. Omit `cast` to avoid
    // bloating balance-list items and caches with full cast payloads.
    ...(token.token?.source && {
      source: {
        platform: token.token.source.platform,
        platformUrl: token.token.source.platformUrl,
        createdAt: token.token.source.createdAt,
        creator: token.token.source.creator,
        creatorAddress: token.token.source.creatorAddress,
        creatorIdentity: token.token.source.creatorIdentity,
      },
    }),
  };
};

export const parseTokenAmount = (
  amount: string | bigint | number,
  decimals: number,
) => {
  if (typeof amount === 'string' || typeof amount === 'number') {
    amount = BigInt(amount);
  }
  return parseFloat(formatUnits(amount, decimals));
};

export const formatFee = (fee: number) => {
  return fee.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPriceWorklet = (
  value?: number | string,
  showDollarSign = true,
) => {
  'worklet';
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    value = Number(value);
  }

  if (value <= 0.0001) {
    return `${showDollarSign ? '$' : ''}${value.toLocaleString(undefined, {
      maximumFractionDigits: 8,
    })}`;
  }

  if (value < 1) {
    return `${showDollarSign ? '$' : ''}${value.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })}`;
  }

  return `${showDollarSign ? '$' : ''}${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
};

export const formatBalance = (value?: number) => {
  if (!value) {
    return '';
  }

  const result = value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  if (result === '0.00') {
    return '< $0.01';
  }

  return `$${result}`;
};

export const formatBalanceWorklet = (value?: number) => {
  'worklet';
  if (!value) {
    return '';
  }

  const result = value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  if (result === '0.00') {
    return '< $0.01';
  }

  return `$${result}`;
};

export function toAnalyticsName(token: ApiOnchainTokenMinimal) {
  return `${token.symbol ?? 'unknown'} (chain: ${token.chain}, ca: ${token.ca})`;
}

export function sortBalancesByPriority(
  balances: ApiEthFungibleTokenPosition[],
  chain: ApiChain,
): ApiTokenLink[] {
  const tokens = balances.map((balance) => tokenPositionToTokenLink(balance));

  // Sort by priority
  return tokens.sort((a, b) => {
    const aPriority = getTokenPriority(a, chain);
    const bPriority = getTokenPriority(b, chain);

    return aPriority - bPriority; // Lower number = higher priority
  });
}

function getTokenPriority(
  token: ApiTokenLink,
  preferredChain: ApiChain,
): number {
  const isNativeToken = isNativeAsset(token.ca);
  const isUsdcToken = isUsdc(token.ca);
  const isSameChain = token.chain === preferredChain;
  const isEth = !['solana', 'hyperevm', 'celo', 'bsc', 'gnosis'].includes(
    token.chain,
  );
  const isSolana = token.chain === 'solana';

  // Lowest priority
  if (token.chain === 'base-sepolia' || token.chain === 'monad-testnet') {
    return 9;
  }

  // Priority order (lower number = higher priority):
  // 1. USDC: Same Chain
  if (isUsdcToken && isSameChain) {
    return 1;
  }

  // 2. Native: Same Chain
  if (isNativeToken && isSameChain) {
    return 2;
  }

  // 3. USDC: Other Chains
  if (isUsdcToken) {
    return 3;
  }

  // 4. Native ETH
  if (isNativeToken && isEth) {
    return 4;
  }

  // 5. Native SOL
  if (isNativeToken && isSolana) {
    return 5;
  }

  // 6. Native: Other Chains
  if (isNativeToken) {
    return 6;
  }

  // 7. Any: Same Chain
  if (isSameChain) {
    return 7;
  }

  // 8. Any: Other Chains
  return 8;
}

export const isAddress = (query: string) => {
  return isEvmAddress(query) || isSolanaAddress(query);
};

/**
 * This is not a true CAIP standard, but something we came up with for now.
 */
export const buildCaipTxUri = (chain: ApiChain, tx: string): string => {
  if (chain === 'solana') {
    // Use Phantom's format with mainnet-beta cluster ID (101)
    return `solana:101/tx:${tx}`;
  }

  // EVM chains
  const chainId = apiChainToChainIdOrThrow(chain);
  return `eip155:${chainId}/tx:${tx}`;
};

/**
 * Parses a CAIP-19 URI back to chain and contract address
 */
export const parseCaip19TokenUri = (
  uri: string,
): { chain: ApiChain; ca: string } | null => {
  // Handle EVM tokens
  if (uri.startsWith('eip155:') && uri.includes('/erc20:')) {
    const match = uri.match(/^eip155:(\d+)\/erc20:(0x[a-fA-F0-9]{40})$/);
    if (!match) {
      return null;
    }

    const chainId = match[1];
    const address = match[2];
    const chain = chainIdToChain(chainId);

    if (!chain) {
      return null;
    }
    return { chain, ca: address };
  }

  // Handle Solana tokens (both token: and address: namespaces)
  if (uri.startsWith('solana:')) {
    const tokenMatch = uri.match(
      /^solana:[a-zA-Z0-9]+\/(token|address):([a-zA-Z0-9]{32,44})$/,
    );
    if (tokenMatch) {
      return { chain: 'solana', ca: tokenMatch[2] };
    }
  }

  return null;
};
