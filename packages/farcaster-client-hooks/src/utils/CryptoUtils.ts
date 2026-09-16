import {
  ApiChain,
  chainIdToChain,
  formatEthAddress,
} from 'farcaster-client-data';
import millify from 'millify';
import { formatUnits, parseUnits } from 'viem';

import { formatShorthandNumberWorklet } from './MillifyUtils';
import { formatShorthandNumber } from './NumberUtils';

/**
 * Formats any address (Ethereum, Solana, etc.) for display.
 * For 0x-prefixed addresses, inserts a zero-width space after '0x' to prevent
 * font ligatures from affecting the display.
 */
export const formatAddress = (address: string) => {
  if (address.startsWith('0x')) {
    address = address.slice(2);
    // We insert a zero-width space between the 0x and the first character to prevent
    // fonts from using contextual alternates when displaying the address.
    // Inter, for example, will render the x differently when the next character is a
    // digit instead of a letter.
    return '0x\u200B' + address.substring(0, 4) + '…' + address.slice(-4);
  } else {
    return address.slice(0, 4) + '…' + address.slice(-4);
  }
};

/**
 * @deprecated - prefer using bigint quantities with formatTokenQuantity
 */
export const formatTokenFloat = (value: number) => {
  if (value <= 0.001) {
    return value.toLocaleString('en-US', {
      maximumSignificantDigits: 3,
    });
  }

  if (value < 1) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 3,
    });
  }

  if (value < 10) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  }

  if (value < 100) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 1,
    });
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
};

export const formatTokenQuantity = (options: {
  quantity: bigint;
  decimals: number;
  // If price is provided subcent precision will be truncated
  price?: number;
  strategy?: 'truncate' | 'round' | 'exact';
}) => {
  return tokenQuantityToFloat(options).toLocaleString(undefined, {
    minimumSignificantDigits: 1,
  });
};

export function getMostSignificantDigitPosition(num: number) {
  if (num === 0 || isNaN(num)) {
    return 0;
  }

  const absNum = Math.abs(num);
  const [, exponent] = absNum.toExponential(0).split('e');

  return parseInt(exponent);
}

/**
 * Truncates a subsent precision from a token quantity.
 */
export function truncateTokenQuantity({
  quantity,
  decimals,
  price,
}: {
  quantity: bigint;
  decimals: number;
  price: number;
}) {
  const quantityDecimals = quantity.toString().length;
  const centsMsdPosition = getMostSignificantDigitPosition(price * 100);
  // Don't truncate sub cent quantites that are whole integers. Arbitrary but
  // users get confused otherwise.
  const subCentDecimals = decimals - Math.max(-1, centsMsdPosition);

  return BigInt(
    quantity
      .toString()
      .slice(0, Math.max(quantityDecimals - subCentDecimals + 1, 1))
      .padEnd(quantityDecimals, '0'),
  );
}

/**
 * Like truncateTokenQuantity, but always rounds up.
 */
export function truncateTokenQuantityRoundUp({
  quantity,
  decimals,
  price,
}: {
  quantity: bigint;
  decimals: number;
  price: number;
}) {
  const quantityStr = quantity.toString();
  const quantityDecimals = quantityStr.length;
  const centsMsdPosition = getMostSignificantDigitPosition(price * 100);
  const subCentDecimals = decimals - centsMsdPosition;
  const truncatePosition = Math.max(quantityDecimals - subCentDecimals + 1, 1);

  const shouldRoundUp = quantityStr.length > truncatePosition;
  let truncatedValue = quantityStr.slice(0, truncatePosition);

  if (shouldRoundUp) {
    const lastDigit = parseInt(truncatedValue[truncatedValue.length - 1]);
    truncatedValue = truncatedValue.slice(0, -1) + (lastDigit + 1).toString();
  }

  return BigInt(truncatedValue.padEnd(quantityDecimals, '0'));
}

export function tokenQuantityToFloat({
  quantity,
  decimals,
  price,
  strategy = 'truncate',
}: {
  quantity: bigint;
  decimals: number;
  // If price is provided subcent precision will be truncated
  price?: number;
  strategy?: 'truncate' | 'round' | 'exact';
}) {
  if (price) {
    return parseFloat(
      formatUnits(
        (() => {
          switch (strategy) {
            case 'truncate':
              return truncateTokenQuantity({
                quantity,
                decimals,
                price,
              });
            case 'round':
              return truncateTokenQuantityRoundUp({
                quantity,
                decimals,
                price,
              });
            case 'exact':
              return quantity;
          }
        })(),
        decimals,
      ),
    );
  }

  return parseFloat(formatUnits(quantity, decimals));
}

export function tokenQuantityToUsdFloat({
  quantity,
  decimals,
  price,
  round = false,
  isStablecoin = false,
}: {
  quantity: bigint;
  decimals: number;
  price: number;
  round?: boolean;
  isStablecoin?: boolean;
}) {
  const amount = tokenQuantityToFloat({ quantity, decimals });
  const value = isStablecoin ? amount : amount * price;
  return round ? Math.round(value * 100) / 100 : value;
}

export function usdFloatToTokenQuantity({
  value,
  price,
  decimals,
}: {
  value: number;
  price: number;
  decimals: number;
}) {
  const tokenAmount = value / price;
  const rawQuantity = parseUnits(
    tokenAmount.toFixed(Math.min(decimals, 20)),
    decimals,
  );
  const quantityDecimals = rawQuantity.toString().length;
  const centsMsdPosition = getMostSignificantDigitPosition(price * 100);
  const subCentDecimals = decimals - centsMsdPosition;

  // truncate subcent precission
  return BigInt(
    rawQuantity
      .toString()
      .slice(0, Math.max(quantityDecimals - subCentDecimals + 1, 1))
      .padEnd(quantityDecimals, '0'),
  );
}

export function tokenQuantityPercentage({
  quantity,
  decimals,
  price,
  percentage,
}: {
  quantity: bigint;
  decimals: number;
  // If price is provided subcent precision will be truncated
  price?: number;
  // Specified as an integer from 1-100
  percentage: number;
}) {
  if (percentage === 100) {
    return quantity;
  }

  const percentQuantity = (quantity * BigInt(percentage)) / BigInt(100);

  if (!price) {
    return percentQuantity;
  }

  return truncateTokenQuantity({
    quantity: percentQuantity,
    price,
    decimals,
  });
}

export function tokenAnalyticsName({
  symbol,
  address,
  chainId,
}: {
  symbol?: string;
  address?: string;
  chainId: number;
}) {
  return `${symbol ?? 'unknown'} (chainId: ${chainId}, ca: ${
    address ?? 'native'
  })`;
}

export function formatTokenSymbol(
  str: string | undefined,
  address?: string,
  maxLength: number = 12,
) {
  // TODO: Handle [invalid] on backend
  if (!str || str.trim() === '' || str === '[invalid]') {
    return address ? formatEthAddress(address).slice(0, 8) : 'Unknown';
  } else {
    if (str.length <= maxLength) {
      return str;
    }
    return `${str.slice(0, maxLength)}...`;
  }
}

const DEFAULT_NATIVE_TOKEN = 'ETH';
const NATIVE_TOKEN_OVERRIDES: Map<ApiChain, string> = new Map([
  ['celo', 'CELO'],
  ['degen', 'DEGEN'],
]);

export function formatTokenName(
  str: string | undefined,
  address?: string,
  chain?: ApiChain,
) {
  // TODO: Handle [invalid] on backend
  if (str === undefined || str === '[invalid]') {
    const nativeTokenOverride = chain
      ? NATIVE_TOKEN_OVERRIDES.get(chain)
      : undefined;
    return address
      ? formatEthAddress(address).slice(0, 8)
      : (nativeTokenOverride ?? DEFAULT_NATIVE_TOKEN);
  } else {
    return str;
  }
}

// New functions

interface PriceOptions {
  maximumSignificantDigits?: number;
  showPositiveSign?: boolean;
  showDollarSign?: boolean;
  useGrouping?: boolean;
}

export const formatPrice = (
  value: number | string,
  {
    maximumSignificantDigits,
    showPositiveSign = false,
    showDollarSign = true,
    useGrouping = true,
  }: PriceOptions = {},
) => {
  if (typeof value === 'string') {
    value = Number(value);
  }

  const absValue = Math.abs(value);
  const sign = (() => {
    if (value < 0) {
      return '-';
    }

    if (value > 0 && showPositiveSign) {
      return '+';
    }

    return '';
  })();

  if (absValue < 0.01) {
    return `${sign}${showDollarSign ? '$' : ''}${absValue.toLocaleString(
      undefined,
      {
        maximumSignificantDigits,
        maximumFractionDigits: 6,
        useGrouping,
      },
    )}`;
  }

  if (absValue < 1_000_000_000) {
    return `${sign}${showDollarSign ? '$' : ''}${absValue.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping,
      },
    )}`;
  }

  return `${sign}${showDollarSign ? '$' : ''}${millify(absValue, {
    lowercase: false,
    precision: 2,
  })}`;
};

interface PriceOptions {
  showPositiveSign?: boolean;
  showDollarSign?: boolean;
  useGrouping?: boolean;
}

interface AmountOptions {
  priceUsd?: number;
  useGrouping?: boolean;
}

export const formatAmount = (
  amount: number | string,
  { priceUsd = 0, useGrouping = true }: AmountOptions = {},
) => {
  if (typeof amount === 'string') {
    amount = Number(amount);
  }

  if (amount >= 1) {
    return `${amount.toLocaleString(undefined, {
      maximumFractionDigits: amount >= 1000 ? 0 : priceUsd > 1 ? 4 : 2,
      useGrouping,
    })}`;
  }

  return `${amount.toLocaleString(undefined, {
    maximumFractionDigits: 6,
    useGrouping,
  })}`;
};

export const formatShorthandAmountWorklet = (value: number) => {
  'worklet';
  if (value <= 0.01) {
    return `${value.toLocaleString(undefined, {
      maximumSignificantDigits: 3,
    })}`;
  }

  if (value < 1) {
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  if (value < 10_000) {
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  }

  return formatShorthandNumberWorklet(value, 2);
};

export const formatShorthandAmount = (value: number) => {
  if (value <= 0.01) {
    return `${value.toLocaleString(undefined, {
      maximumSignificantDigits: 3,
    })}`;
  }

  if (value < 1000) {
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return formatShorthandNumber(value, 2);
};

export const formatBalance = (
  value: number,
  priceUsd = 0,
  useGrouping = true,
) => {
  if (value <= 0.001) {
    return `${value.toLocaleString(undefined, {
      maximumSignificantDigits: 4,
      useGrouping,
    })}`;
  }

  if (value < 1) {
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 6,
      useGrouping,
    })}`;
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1000 ? 0 : priceUsd > 1 ? 4 : 2,
    minimumFractionDigits: 0,
    useGrouping,
  })}`;
};

export const formatTokenStat = (value?: number | string, fallback = '') => {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'string') {
    value = Number(value);
  }

  const formatted = `$${formatShorthandNumber(value, value < 1_000_000 ? 0 : 2)}`;
  return formatted === '$0' ? fallback : formatted;
};

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

export function formatPercent({ value }: { value: number }) {
  if (value === null || isNaN(value)) return '-';

  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
