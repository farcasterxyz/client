import {
  ApiChain,
  ApiOnchainTokenMinimal,
  ApiTokenLink,
} from 'farcaster-client-data';
import { WalletPositionsFetcherData } from 'farcaster-client-hooks';
import { formatUnits } from 'viem';

import { TokenBalance } from './useTokenBalance';

function formatTokenDecimals(decimals?: number) {
  return decimals ?? 18;
}

function parseTokenAmount(amount: string, decimals: number) {
  return Number(formatUnits(BigInt(amount), decimals));
}

function tokenLinkToMinimalToken(token: ApiTokenLink): ApiOnchainTokenMinimal {
  return {
    chain: token.chain,
    ca: token.ca,
    name: token.name,
    symbol: token.ticker,
    decimals: formatTokenDecimals(token.decimals),
    imageUrl: token.imageUrl,
    priceUsd: token.priceUsd ? Number(token.priceUsd) : 0,
    marketCap: token.marketCap ?? 0,
  };
}

export function resolveTokenBalanceData({
  chain,
  ca,
  tokenData,
  walletContext,
  onchainBalance,
  cachedPosition,
  previousData,
}: {
  chain?: ApiChain;
  ca?: string;
  tokenData?: ApiTokenLink;
  walletContext?: {
    hidden?: boolean;
    position: {
      quantity: {
        int?: string | null;
      };
      valueUsd?: number | null;
    };
  };
  onchainBalance?: bigint | null;
  cachedPosition?: WalletPositionsFetcherData['positions'][number];
  previousData?: TokenBalance;
}): TokenBalance | undefined {
  if (!chain || !ca) {
    return undefined;
  }

  const tokenSource = tokenData ?? cachedPosition?.token;
  const token = tokenSource
    ? tokenLinkToMinimalToken(tokenSource)
    : previousData?.token;

  if (!token) {
    return previousData;
  }

  const cachedToken = cachedPosition?.token;
  const decimals = formatTokenDecimals(
    tokenData?.decimals ?? cachedToken?.decimals ?? token.decimals,
  );
  const int = onchainBalance
    ? onchainBalance.toString()
    : (walletContext?.position.quantity.int ??
      cachedPosition?.quantity.int ??
      previousData?.quantity.int ??
      '0');
  const float = parseTokenAmount(int, decimals);

  const cachedValueUsd = cachedPosition?.value ?? 0;
  const liveValueUsd = walletContext?.position.valueUsd ?? 0;
  const walletContextValueUsd =
    liveValueUsd > 0
      ? liveValueUsd
      : cachedValueUsd > 0
        ? cachedValueUsd
        : (previousData?.valueUsd ?? 0);
  const tokenPriceUsdCandidates = [
    Number(tokenData?.priceUsd ?? 0),
    Number(cachedToken?.priceUsd ?? 0),
    previousData?.priceUsd ?? 0,
  ];
  const tokenPriceUsd = tokenPriceUsdCandidates.find((price) => price > 0) ?? 0;
  const impliedPriceUsd =
    float > 0 && walletContextValueUsd > 0 ? walletContextValueUsd / float : 0;
  const priceUsd =
    tokenPriceUsd > 0
      ? tokenPriceUsd
      : impliedPriceUsd > 0
        ? impliedPriceUsd
        : (previousData?.priceUsd ?? 0);
  const valueUsd =
    walletContextValueUsd > 0
      ? walletContextValueUsd
      : priceUsd > 0
        ? float * priceUsd
        : (previousData?.valueUsd ?? 0);

  return {
    quantity: {
      float,
      int,
    },
    priceUsd,
    valueUsd,
    userHidden: walletContext?.hidden ?? previousData?.userHidden ?? false,
    token,
  };
}
