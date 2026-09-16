import {
  ApiChain,
  apiChainDisplayName,
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiLimitOrder,
  ApiTokenLink,
  BaseError,
  formatDisplayDollars,
  getFirstApiErrorBody,
  isFarcasterApiError,
  isUnhandledFetchError,
  isUsdc,
} from 'farcaster-client-data';
import { formatAmount } from 'farcaster-client-hooks';
import { isAddress, TransactionExecutionError } from 'viem';

import { isNativeAsset, isSameAsset } from './CryptoUtils';

function isErrorNamed(error: unknown, name: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as { name?: string; cause?: unknown };
  if (err.name === name) {
    return true;
  }

  return err.cause ? isErrorNamed(err.cause, name) : false;
}

function isTransactionExecutionError(error: unknown): boolean {
  return (
    error instanceof TransactionExecutionError ||
    isErrorNamed(error, 'TransactionExecutionError')
  );
}

function getInsufficientGasUserErrorMessage(chain: ApiChain): string {
  const gasSymbol = apiChainToViemChainOrThrow(chain).nativeCurrency.symbol;
  const chainName = apiChainDisplayName(chain);
  return `Not enough ${gasSymbol} on ${chainName} to pay for gas to approve this token`;
}

export function getLimitOrderSubmitErrorMessage(
  error: unknown,
  chain: ApiChain | undefined,
): string {
  if (isUserRejectedError(error)) {
    return 'Transaction rejected';
  }
  if (chain && isTransactionExecutionError(error)) {
    return getInsufficientGasUserErrorMessage(chain);
  }
  if (isErrorNamed(error, 'ContractFunctionExecutionError')) {
    return 'Approval failed';
  }
  if (error instanceof Error && error.message === 'Approval failed') {
    return 'Approval failed';
  }
  return getLimitOrderUserErrorMessage(error, 'Order failed');
}

function positionCanLimitOrder(position: ApiEthFungibleTokenPosition): boolean {
  const features = {
    ...(position.features ?? {}),
    ...(position.token?.features ?? {}),
  };
  return features.canLimitOrder === true;
}

const GENERIC_LIMIT_ORDER_ERROR = 'Something went wrong. Please try again.';
const LIMIT_ORDER_OFFLINE_ERROR =
  'You appear to be offline. Check your connection and try again.';
const LIMIT_ORDER_TIMEOUT_ERROR = 'Request timed out. Please try again.';
const LIMIT_ORDER_NETWORK_ERROR =
  'Connection problem. Check your network and try again.';

const TECHNICAL_LIMIT_ORDER_ERROR_MESSAGES = new Set([
  'Unhandled fetch error',
  'Unhandled fetch error.',
]);

export const LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE =
  'Limit orders are not available for your account';

export const LIMIT_ORDERS_UNAVAILABLE_TOKEN_DESCRIPTION =
  'Not available for this token';

export function computeLimitOrderProgressPct({
  isBuy,
  buyAmount,
  sellAmount,
  executedBuyAmount,
  executedSellAmount,
}: {
  isBuy: boolean;
  buyAmount: string;
  sellAmount: string;
  executedBuyAmount?: string;
  executedSellAmount?: string;
}): number {
  try {
    const total = BigInt(isBuy ? buyAmount : sellAmount);
    const executed = BigInt(
      isBuy ? (executedBuyAmount ?? '0') : (executedSellAmount ?? '0'),
    );
    if (total <= 0n) {
      return 0;
    }

    const pctScaled = (executed * 10000n) / total;
    const pct = Number(pctScaled) / 100;
    return Math.min(100, Math.max(0, pct));
  } catch {
    return 0;
  }
}

export function getLimitOrderUnavailableDescription({
  limitOrdersEnabled,
  token,
}: {
  limitOrdersEnabled: boolean;
  token?: ApiTokenLink;
}): string | undefined {
  if (!limitOrdersEnabled) {
    return LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE;
  }
  if (token && !tokenSupportsLimitOrder(token)) {
    return LIMIT_ORDERS_UNAVAILABLE_TOKEN_DESCRIPTION;
  }
  return undefined;
}

function isUserRejectedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { name?: string; code?: number; cause?: unknown };
  if (err.name === 'UserRejectedRequestError' || err.code === 4001) {
    return true;
  }

  if (err.cause) {
    return isUserRejectedError(err.cause);
  }

  return false;
}

function containsInternalErrorDetails(message: string): boolean {
  return (
    message.includes('Details:') ||
    message.includes('Request:') ||
    message.includes('Response:')
  );
}

function isTechnicalLimitOrderErrorMessage(message: string): boolean {
  return (
    TECHNICAL_LIMIT_ORDER_ERROR_MESSAGES.has(message) ||
    containsInternalErrorDetails(message)
  );
}

export function isRetryableLimitOrderNetworkError(error: unknown): boolean {
  if (isFarcasterApiError(error)) {
    return (
      error.isOffline ||
      error.hasTimedOut ||
      error.isNetworkError ||
      isUnhandledFetchError(error)
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network request failed') ||
      message.includes('failed to fetch') ||
      message.includes('network error')
    );
  }

  return false;
}

function getFarcasterApiUserErrorMessage(
  error: unknown,
  fallback: string,
): string | undefined {
  if (!isFarcasterApiError(error)) {
    return undefined;
  }

  if (error.isOffline) {
    return LIMIT_ORDER_OFFLINE_ERROR;
  }
  if (error.hasTimedOut) {
    return LIMIT_ORDER_TIMEOUT_ERROR;
  }
  if (error.isNetworkError || isUnhandledFetchError(error)) {
    return LIMIT_ORDER_NETWORK_ERROR;
  }

  const apiError = getFirstApiErrorBody(error);
  if (apiError?.message) {
    return apiError.message;
  }

  if (isUnhandledFetchError(error)) {
    return fallback;
  }

  return undefined;
}

function sanitizeFarcasterClientShortMessage(shortMessage: string): string {
  const match = shortMessage.match(/^[a-zA-Z0-9_]+\s+\d{3}\s+-\s+(.+)$/s);
  if (match?.[1]) {
    return match[1].trim();
  }

  return shortMessage;
}

export function getLimitOrderUserErrorMessage(
  error: unknown,
  fallback = GENERIC_LIMIT_ORDER_ERROR,
): string {
  if (typeof error === 'string') {
    return isTechnicalLimitOrderErrorMessage(error) ? fallback : error;
  }

  if (isUserRejectedError(error)) {
    return 'Transaction rejected';
  }

  const fetchErrorMessage = getFarcasterApiUserErrorMessage(error, fallback);
  if (fetchErrorMessage) {
    return fetchErrorMessage;
  }

  const apiError = getFirstApiErrorBody(error);
  if (apiError?.message) {
    return apiError.message;
  }

  if (error instanceof BaseError) {
    const sanitized = sanitizeFarcasterClientShortMessage(error.shortMessage);
    if (
      sanitized &&
      !isTechnicalLimitOrderErrorMessage(sanitized) &&
      !containsInternalErrorDetails(sanitized)
    ) {
      return sanitized;
    }

    return fallback;
  }

  if (error instanceof Error) {
    if (isTechnicalLimitOrderErrorMessage(error.message)) {
      return fallback;
    }

    if (containsInternalErrorDetails(error.message)) {
      return fallback;
    }

    return error.message || fallback;
  }

  return fallback;
}

export function tokenSupportsLimitOrderQuote(
  token: ApiTokenLink,
  selectedToken?: ApiTokenLink,
): boolean {
  if (selectedToken && token.chain !== selectedToken.chain) {
    return false;
  }
  if (isNativeAsset(token.ca) || !isAddress(token.ca)) {
    return false;
  }
  if (
    selectedToken &&
    isSameAsset({ chain: token.chain, ca: token.ca, asset: selectedToken })
  ) {
    return false;
  }
  if (isUsdc(token.ca)) {
    return true;
  }
  return (
    token.priceUsd !== undefined &&
    token.priceUsd !== null &&
    Number(token.priceUsd) > 0
  );
}

export function tokenPositionSupportsLimitOrderQuote(
  position: ApiEthFungibleTokenPosition,
  selectedToken?: ApiTokenLink,
): boolean {
  if (selectedToken && position.chain !== selectedToken.chain) {
    return false;
  }
  if (
    !position.address ||
    isNativeAsset(position.address) ||
    !isAddress(position.address)
  ) {
    return false;
  }
  if (
    selectedToken &&
    position.address.toLowerCase() === selectedToken.ca.toLowerCase()
  ) {
    return false;
  }
  if (isUsdc(position.address)) {
    return true;
  }
  const priceUsd =
    position.token?.priceUsd !== undefined && position.token?.priceUsd !== null
      ? Number(position.token.priceUsd)
      : position.price;
  return priceUsd !== undefined && priceUsd > 0;
}

export function tokenSupportsLimitOrder(token: ApiTokenLink): boolean {
  if (isUsdc(token.ca)) {
    return false;
  }
  if (token.features?.canLimitOrder !== true) {
    return false;
  }
  if (isNativeAsset(token.ca) || !isAddress(token.ca)) {
    return false;
  }
  return true;
}

export function tokenPositionSupportsLimitOrder(
  position: ApiEthFungibleTokenPosition,
): boolean {
  if (isUsdc(position.address)) {
    return false;
  }
  if (!positionCanLimitOrder(position)) {
    return false;
  }
  if (
    !position.address ||
    isNativeAsset(position.address) ||
    !isAddress(position.address)
  ) {
    return false;
  }
  return true;
}

export const LIMIT_ORDER_NO_EXPIRATION_LABEL = 'No expiration';

// CoW requires validTo on every order; this is the longest practical window for
// "until filled or cancelled" orders without triggering ExcessiveValidTo.
export const LIMIT_ORDER_UNTIL_CANCELLED_VALIDITY_SECONDS = 365 * 24 * 60 * 60;

export type LimitOrderExpiryOption = '1d' | '7d' | '30d' | 'none';

export function getLimitOrderExpiryFromMetadata(
  metadata: unknown,
): LimitOrderExpiryOption | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const expiry = (metadata as { expiry?: unknown }).expiry;
  if (
    expiry === '1d' ||
    expiry === '7d' ||
    expiry === '30d' ||
    expiry === 'none'
  ) {
    return expiry;
  }

  return undefined;
}

export function isNoExpirationLimitOrder(order: ApiLimitOrder): boolean {
  return getLimitOrderExpiryFromMetadata(order.metadata) === 'none';
}

export function formatLimitOrderExpiryDisplay(order: ApiLimitOrder): string {
  if (isNoExpirationLimitOrder(order)) {
    return LIMIT_ORDER_NO_EXPIRATION_LABEL;
  }

  return formatLimitOrderTimeLeft(order.deadline);
}

export function getLimitOrderExpirySeconds(
  expiry: LimitOrderExpiryOption,
  nowSeconds = Math.floor(Date.now() / 1000),
): number {
  if (expiry === '1d') return nowSeconds + 24 * 60 * 60;
  if (expiry === '7d') return nowSeconds + 7 * 24 * 60 * 60;
  if (expiry === '30d') return nowSeconds + 30 * 24 * 60 * 60;
  // expiry === 'none': "No expiration" in the UI, but CoW requires validTo on every order.
  return nowSeconds + LIMIT_ORDER_UNTIL_CANCELLED_VALIDITY_SECONDS;
}

export function truncateLimitOrderTxHash(txHash: string): string {
  return `${txHash.slice(0, 5)}...${txHash.slice(-4)}`;
}

export function formatLimitOrderTimeLeft(deadline: number): string {
  const diff = deadline - Date.now();
  if (diff <= 0) return 'Expired';
  const diffMins = Math.floor(diff / 60000);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diff / 3600000);
  if (diffHours < 24) return `${diffHours}h left`;
  const diffDays = Math.floor(diff / 86400000);
  return `${diffDays}d left`;
}

export function isActiveLimitOrderStatus(
  status: ApiLimitOrder['status'],
): boolean {
  return (
    status === 'open' || status === 'submitted' || status === 'cancel_pending'
  );
}

export function formatLimitOrderValueStr({
  quoteTokenCa,
  quoteTokenSymbol,
  isBuy,
  totalSellFormatted,
  totalBuyFormatted,
  executedSellFormatted,
  executedBuyFormatted,
  showPartialProgress,
}: {
  quoteTokenCa: string | undefined;
  quoteTokenSymbol: string | undefined;
  isBuy: boolean;
  totalSellFormatted: string;
  totalBuyFormatted: string;
  executedSellFormatted: string;
  executedBuyFormatted: string;
  showPartialProgress: boolean;
}): string {
  const isStableQuote = isUsdc(quoteTokenCa ?? '');
  const symbol = quoteTokenSymbol ?? '';

  if (isStableQuote) {
    const totalVal = formatDisplayDollars(
      Number(isBuy ? totalSellFormatted : totalBuyFormatted),
    );
    const execVal = formatDisplayDollars(
      Number(isBuy ? executedSellFormatted : executedBuyFormatted),
    );
    return showPartialProgress ? `${execVal} of ${totalVal}` : totalVal;
  }

  const totalVal = formatAmount(
    Number(isBuy ? totalSellFormatted : totalBuyFormatted),
  );
  const execVal = formatAmount(
    Number(isBuy ? executedSellFormatted : executedBuyFormatted),
  );
  if (showPartialProgress) {
    return symbol
      ? `${execVal} of ${totalVal} ${symbol}`
      : `${execVal} of ${totalVal}`;
  }

  return symbol ? `${totalVal} ${symbol}` : totalVal;
}
