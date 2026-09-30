import {
  type ApiEthFungibleTokenPosition,
  type ApiEthNonFungibleToken,
  type ApiOnchainTokenChartPeriod,
  type ApiOnchainTokenChartResolution,
  type ApiSwapIntentToken,
  type ApiSwapToken,
  chainIdToChainOrThrow,
} from 'farcaster-client-data';
import { formatAddress } from 'farcaster-client-hooks';

import type { SlippageSettings } from '../types';
import { isNativeAsset } from '../utils';
import { getStorage } from './FastStorageUtils';

export function setWalletTabNudged({ nudged }: { nudged: boolean }) {
  getStorage().set('already-nudged-wallet-tab', nudged);
}

export const DEFAULT_SLIPPAGE_PCT = 1.5;
export const DEFAULT_SLIPPAGE_SETTINGS: SlippageSettings = {
  auto: true,
  lastSelectedSlippage: DEFAULT_SLIPPAGE_PCT,
};

/**
 * Converts slippage settings to API parameter format
 * @param slippageSettings - The slippage configuration object
 * @returns undefined when auto slippage is enabled (letting the backend decide),
 *          or a number in basis points (e.g., 1% = 100 basis points) otherwise
 */
export const slippageSettingsToApiParam = (
  slippageSettings?: SlippageSettings,
): number | undefined => {
  if (!slippageSettings || slippageSettings.auto) {
    return undefined;
  }
  const percentageValue = slippageSettings.slippage;
  const basisPoints = Math.round(percentageValue * 100);
  return Math.max(basisPoints, 0);
};

function isSwapToken(
  token: ApiSwapIntentToken | ApiSwapToken,
): token is ApiSwapToken {
  return typeof (token as ApiSwapToken).chain !== 'undefined';
}

function isEthFungibleTokenPosition(
  token: ApiSwapIntentToken | ApiSwapToken | ApiEthFungibleTokenPosition,
): token is ApiEthFungibleTokenPosition {
  return typeof (token as ApiEthFungibleTokenPosition).id !== 'undefined';
}

export function getIdFromApiToken(
  token: ApiSwapIntentToken | ApiSwapToken | ApiEthFungibleTokenPosition,
): string {
  if (isEthFungibleTokenPosition(token)) {
    return token.id;
  }

  const chain = isSwapToken(token)
    ? token.chain
    : chainIdToChainOrThrow(token.chainId.toString());
  return `${chain}:${isNativeAsset(token.address) ? 'native' : chain === 'solana' ? token.address : token.address?.toLowerCase()}`;
}

export function isFarcasterProNFT(token: ApiEthNonFungibleToken) {
  return (
    token.chainId === 8453 &&
    [
      '0xbbb0004ef33de15455d735b1209466857bf03efb',
      '0x61886e7d61f4086ada1829880af440aa0de3fc96',
    ].includes(token.contractAddress.toLowerCase())
  );
}

export function getFarcasterProNFTImage({
  token,
  size = 'sm',
}: {
  token: ApiEthNonFungibleToken;
  size?: 'sm' | 'lg';
}) {
  if (isFarcasterProNFT(token)) {
    return size === 'lg'
      ? 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/2cfab3e0-ebb6-4b42-5107-0f9e7d1c7300/original'
      : 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/cd84b519-a16c-4b7e-27ac-20ec6334b000/original';
  } else {
    return token.previewUrl || token.imageUrl;
  }
}

export function getAnnotationPeriod({
  chartType,
  lineChartPeriod,
  candlestickPeriod,
}: {
  chartType: 'candlestick' | 'line';
  lineChartPeriod: ApiOnchainTokenChartPeriod;
  candlestickPeriod: ApiOnchainTokenChartPeriod;
}) {
  if (chartType === 'line') {
    return lineChartPeriod;
  }

  // Map candlestick periods to line chart periods that cover the full time range
  switch (candlestickPeriod) {
    case 'cs_1m':
    case 'cs_5m':
      return 'd1'; // 1 day to cover ~8-41 hours of candles
    case 'cs_15m':
      return 'w1'; // 1 week to cover ~5 days of candles
    case 'cs_1h':
      return 'm1'; // 1 month to cover ~20 days of candles
    case 'cs_4h':
      return 'm1'; // 1 month to cover ~66 days of candles
    case 'cs_1d':
      return 'y1'; // 1 year to cover ~730 days of candles
    case 'cs_1w':
      return 'max'; // All time to cover ~540 weeks
    default:
      return 'max';
  }
}

export function getCandlestickResolution(
  candlestickPeriod: ApiOnchainTokenChartPeriod,
): ApiOnchainTokenChartResolution {
  switch (candlestickPeriod) {
    case 'cs_1m':
      return 'm1';
    case 'cs_5m':
      return 'm5';
    case 'cs_15m':
      return 'm15';
    case 'cs_1h':
      return 'h1';
    case 'cs_4h':
      return 'h4';
    case 'cs_1d':
      return 'd1';
    case 'cs_1w':
      return 'w1';
    default:
      return 'm5';
  }
}

export function getCandleStickTimeRange(
  candlestickPeriod: ApiOnchainTokenChartPeriod,
  now: number | null,
): { from: number; to: number; countback: number } {
  const nowMillis = now ?? Date.now();
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;

  switch (candlestickPeriod) {
    case 'cs_1m': {
      // 1M resolution: 500 countback, 500 minutes range
      const countback = 500;
      const range = 500 * oneMinute;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_5m': {
      // 5M resolution: 500 countback, 2500 minutes range
      const countback = 500;
      const range = 2500 * oneMinute;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_15m': {
      // 15M resolution: 500 countback, 7500 minutes range
      const countback = 500;
      const range = 7500 * oneMinute;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_1h': {
      // 1H resolution: 500 countback, 500 hours range
      const countback = 500;
      const range = 500 * oneHour;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_4h': {
      // 4H resolution: 400 countback, 1600 hours range
      const countback = 400;
      const range = 1600 * oneHour;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_1d': {
      // 1D resolution: 730 countback, 730 days range
      const countback = 730;
      const range = 730 * oneDay;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'cs_1w': {
      // 1W resolution: 540 countback, 540 weeks range
      const countback = 540;
      const range = 540 * oneWeek;
      return {
        from: nowMillis - range,
        to: nowMillis,
        countback,
      };
    }
    case 'h1':
    case 'h6':
    case 'd1':
    case 'w1':
    case 'm1':
    case 'y1':
    case 'max':
    default: {
      // Line chart periods - return minimal range since not used
      return {
        from: nowMillis - oneDay,
        to: nowMillis,
        countback: 0,
      };
    }
  }
}

export { formatAddress };
