import { ApiLimitOrderKind } from 'farcaster-client-data';

/** Matches formatPrice() for sub-cent token prices in the header. */
const SUBCENT_PRICE_DISPLAY_DECIMALS = 6;
const LIMIT_ORDER_OFFSET_PERCENT = 5;
/** Extra decimals allowed beyond header precision while typing. */
const LIMIT_ORDER_INPUT_DECIMAL_BUFFER = 6;
/** Minimum numpad precision for sub-cent tokens (e.g. $0.000002). */
const LIMIT_ORDER_MIN_SUBCENT_INPUT_DECIMALS = 12;

const LIMIT_ORDER_TARGET_PRICE_MAX_DECIMALS = 18;

export function decreaseByPercent(value: number, percent: number): number {
  return value * (1 - percent / 100);
}

export function increaseByPercent(value: number, percent: number): number {
  return value * (1 + percent / 100);
}

/** Snap market price to the same precision shown in the token header. */
export function getDisplayMarketPriceUsd(
  priceUsd: string | number | undefined,
  currentPriceUsd: number,
): number {
  const raw =
    priceUsd !== undefined && priceUsd !== ''
      ? Number(priceUsd)
      : currentPriceUsd;
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  if (raw >= 0.01) {
    return Math.round(raw * 100) / 100;
  }
  const factor = 10 ** SUBCENT_PRICE_DISPLAY_DECIMALS;
  return Math.round(raw * factor) / factor;
}

function getMarketDisplayDecimals(marketPriceUsd: number): number {
  return marketPriceUsd >= 0.01 ? 2 : SUBCENT_PRICE_DISPLAY_DECIMALS;
}

function formatPriceAmount(value: number, decimalPlaces: number): string {
  if (decimalPlaces <= 0) {
    return String(Math.round(value));
  }
  return value
    .toFixed(decimalPlaces)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}

export function computeDefaultLimitOrderTargetPrice({
  currentPriceUsd,
  kind,
  priceUsd,
}: {
  currentPriceUsd: number;
  kind: ApiLimitOrderKind;
  priceUsd?: string | number;
}): string {
  const marketPrice = getDisplayMarketPriceUsd(priceUsd, currentPriceUsd);
  const marketDecimals = getMarketDisplayDecimals(marketPrice);
  const target =
    kind === 'buy'
      ? decreaseByPercent(marketPrice, LIMIT_ORDER_OFFSET_PERCENT)
      : increaseByPercent(marketPrice, LIMIT_ORDER_OFFSET_PERCENT);

  // One extra decimal vs the header price is enough for a 5% offset.
  return formatPriceAmount(target, marketDecimals + 1);
}

/** Max decimals allowed while typing a limit-order target price. */
export function getLimitOrderTargetPriceDecimals(
  currentPriceUsd: number,
  priceUsd?: string | number,
): number {
  if (!Number.isFinite(currentPriceUsd) || currentPriceUsd <= 0) {
    return LIMIT_ORDER_MIN_SUBCENT_INPUT_DECIMALS;
  }
  if (currentPriceUsd >= 0.01) {
    return 2;
  }

  const marketPrice = getDisplayMarketPriceUsd(priceUsd, currentPriceUsd);
  const marketDecimals = getMarketDisplayDecimals(marketPrice);
  return Math.min(
    Math.max(
      marketDecimals + LIMIT_ORDER_INPUT_DECIMAL_BUFFER,
      LIMIT_ORDER_MIN_SUBCENT_INPUT_DECIMALS,
    ),
    LIMIT_ORDER_TARGET_PRICE_MAX_DECIMALS,
  );
}

export function sanitizeLimitOrderTargetPriceInput(
  value: string,
  maxDecimals: number,
): string {
  if (!value || value === '.') {
    return '0';
  }

  const [integerPart = '0', decimalPart] = value.split('.');
  if (decimalPart === undefined) {
    return integerPart || '0';
  }

  return `${integerPart || '0'}.${decimalPart.slice(0, maxDecimals)}`;
}

/** Format target price for the UI — compact when idle, full precision while editing. */
export function formatLimitOrderTargetPriceDisplay(
  value: string,
  priceUsd?: string | number,
  currentPriceUsd?: number,
  options?: { isEditing?: boolean },
): string {
  const normalized = value.trim();
  if (!normalized || normalized === '.') {
    return '0';
  }
  if (normalized.endsWith('.')) {
    return normalized;
  }

  const [whole, fraction] = normalized.split('.');
  if (fraction === undefined) {
    return whole || '0';
  }

  if (options?.isEditing) {
    return `${whole}.${fraction}`;
  }

  let maxDisplayDecimals: number | undefined;
  if (currentPriceUsd !== undefined && Number.isFinite(currentPriceUsd)) {
    const marketPrice = getDisplayMarketPriceUsd(priceUsd, currentPriceUsd);
    maxDisplayDecimals = getMarketDisplayDecimals(marketPrice) + 1;
  }

  const fractionToShow =
    maxDisplayDecimals !== undefined
      ? fraction.slice(0, maxDisplayDecimals)
      : fraction;
  const trimmedFraction = fractionToShow.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

/** Floor USD to whole cents; tolerates floating-point noise in balance values. */
export function usdToFlooredCents(usd: number): number {
  return Math.floor(usd * 100 + 1e-9);
}

/** User-entered USD amounts are limited to two decimal places. */
export function usdToInputCents(usd: number): number {
  return Math.round(usd * 100);
}

export function usdAmountExceedsBalance(
  amountUsd: number,
  availableUsd: number,
): boolean {
  if (amountUsd <= 0) {
    return false;
  }
  return usdToInputCents(amountUsd) > usdToFlooredCents(availableUsd);
}

export function formatUsdPercentageAmount(
  availableUsd: number,
  percentage: number,
): string {
  const cents = Math.floor(availableUsd * percentage * 100 + 1e-9);
  return (cents / 100).toFixed(2);
}

/** Max sell USD at target price, floored to cents. */
export function maxSellUsdAtTargetPrice(
  availableQuantity: number,
  targetPriceUsd: number,
): number {
  if (availableQuantity <= 0 || targetPriceUsd <= 0) {
    return 0;
  }
  return usdToFlooredCents(availableQuantity * targetPriceUsd) / 100;
}

export function sellUsdAmountExceedsBalance(
  amountUsd: number,
  targetPriceUsd: number,
  availableQuantity: number,
): boolean {
  if (amountUsd <= 0 || targetPriceUsd <= 0) {
    return false;
  }
  return (
    usdToInputCents(amountUsd) >
    usdToFlooredCents(availableQuantity * targetPriceUsd)
  );
}
