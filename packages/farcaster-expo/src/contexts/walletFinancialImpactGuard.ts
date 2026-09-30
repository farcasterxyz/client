import {
  ApiOnchainSwapFinancialImpact,
  ApiOnchainSwapQuoteSuccess,
  ApiWalletSwapV2TransactionMetadata,
  isNativeAsset,
} from 'farcaster-client-data';
import { formatUnits } from 'viem';

const DEFAULT_WARN_VALUE_LOSS_BPS = 500;
const DEFAULT_BLOCK_VALUE_LOSS_BPS = 1000;
const DEFAULT_MIN_NOTIONAL_USD = 5;
const DEFAULT_MAX_PRICE_AGE_MS = 10 * 60 * 1000;

type SwapV2GuardMetadata = Omit<
  ApiWalletSwapV2TransactionMetadata,
  'status' | 'error'
>;
type GuardMetadata = { type: string };

export class FinancialImpactBlockedError extends Error {
  financialImpact?: ApiOnchainSwapFinancialImpact;

  constructor(
    message: string,
    financialImpact?: ApiOnchainSwapFinancialImpact,
  ) {
    super(message);
    this.name = 'FinancialImpactBlockedError';
    this.financialImpact = financialImpact;
  }
}

export function getQuoteAcceptanceIdentifier(
  quote: Pick<
    ApiOnchainSwapQuoteSuccess,
    'id' | 'sourceId' | 'source' | 'buyAmount'
  >,
): string {
  return quote.id ?? quote.sourceId ?? `${quote.source}:${quote.buyAmount}`;
}

export function getQuoteAcceptanceStateKey(
  quote: Pick<
    ApiOnchainSwapQuoteSuccess,
    'id' | 'sourceId' | 'source' | 'buyAmount'
  >,
): string {
  return `${getQuoteAcceptanceIdentifier(quote)}:${quote.buyAmount}`;
}

function parseTokenAmount(amount: string, decimals: number): number {
  return parseFloat(formatUnits(BigInt(amount), decimals));
}

function computeLocalFinancialImpact(
  metadata: SwapV2GuardMetadata,
): ApiOnchainSwapFinancialImpact | undefined {
  const warnThresholdBps =
    metadata.quote.financialImpact?.warnThresholdBps ??
    DEFAULT_WARN_VALUE_LOSS_BPS;
  const blockThresholdBps =
    metadata.quote.financialImpact?.blockThresholdBps ??
    DEFAULT_BLOCK_VALUE_LOSS_BPS;
  const minNotionalUsd =
    metadata.quote.financialImpact?.minNotionalUsd ?? DEFAULT_MIN_NOTIONAL_USD;
  const maxPriceAgeMs =
    metadata.quote.financialImpact?.maxPriceAgeMs ?? DEFAULT_MAX_PRICE_AGE_MS;
  const now = Date.now();

  const sellPriceUsd = isNativeAsset(metadata.request.sellToken)
    ? metadata.request.nativePriceUsd
    : (metadata.request.sellPriceUsd ?? metadata.sellToken.priceUsd);
  const usesRequestNativeBuyPrice =
    isNativeAsset(metadata.request.buyToken) &&
    metadata.request.buyChain === metadata.request.sellChain;
  const buyPriceUsd = usesRequestNativeBuyPrice
    ? metadata.request.nativePriceUsd
    : metadata.buyToken.priceUsd;

  if (!sellPriceUsd || sellPriceUsd <= 0 || !buyPriceUsd || buyPriceUsd <= 0) {
    return undefined;
  }

  const sellAmountFloat = parseTokenAmount(
    metadata.request.sellAmount,
    metadata.request.sellDecimals,
  );
  const buyAmountFloat = parseTokenAmount(
    metadata.quote.buyAmount,
    metadata.request.buyDecimals,
  );
  const sellValueUsd = sellAmountFloat * sellPriceUsd;
  const buyValueUsd = buyAmountFloat * buyPriceUsd;
  if (sellValueUsd > 0 && sellValueUsd < minNotionalUsd) {
    return {
      status: 'ok',
      reason: 'NOTIONAL_TOO_LOW_TO_EVALUATE_LOCAL',
      blocked: false,
      wouldBlock: false,
      requiresExplicitAcceptance: false,
      warnThresholdBps,
      blockThresholdBps,
      minNotionalUsd,
      maxPriceAgeMs,
      evaluatedAtMs: now,
      sellValueUsd,
      buyValueUsd,
      sellPriceUsd,
      buyPriceUsd,
      sellPriceTimestampMs: now,
      buyPriceTimestampMs: now,
      sellPriceSource: isNativeAsset(metadata.request.sellToken)
        ? 'request_native_price'
        : 'token_data',
      buyPriceSource: usesRequestNativeBuyPrice
        ? 'request_native_price'
        : 'token_data',
    };
  }

  const valueDeltaUsd = buyValueUsd - sellValueUsd;
  const valueDeltaBps =
    sellValueUsd > 0
      ? Math.round(
          Math.max(Math.min(valueDeltaUsd / sellValueUsd, 10), -10) * 10_000,
        )
      : 0;
  const valueLossUsd = Math.max(sellValueUsd - buyValueUsd, 0);
  const valueLossBps = Math.max(-valueDeltaBps, 0);
  const requiresExplicitAcceptance =
    valueLossBps >= warnThresholdBps && valueLossBps < blockThresholdBps;
  const wouldBlock = valueLossBps >= blockThresholdBps;

  return {
    status: wouldBlock ? 'excessive_loss' : 'ok',
    reason: wouldBlock ? 'VALUE_LOSS_EXCEEDED_LOCAL' : 'WITHIN_THRESHOLD_LOCAL',
    blocked: wouldBlock,
    wouldBlock,
    requiresExplicitAcceptance,
    warnThresholdBps,
    blockThresholdBps,
    minNotionalUsd,
    maxPriceAgeMs,
    evaluatedAtMs: now,
    sellValueUsd,
    buyValueUsd,
    valueDeltaUsd,
    valueDeltaBps,
    valueLossUsd,
    valueLossBps,
    sellPriceUsd,
    buyPriceUsd,
    sellPriceTimestampMs: now,
    buyPriceTimestampMs: now,
    sellPriceSource: isNativeAsset(metadata.request.sellToken)
      ? 'request_native_price'
      : 'token_data',
    buyPriceSource: usesRequestNativeBuyPrice
      ? 'request_native_price'
      : 'token_data',
  };
}

function assertBadQuoteAccepted(
  metadata: SwapV2GuardMetadata,
  financialImpact: ApiOnchainSwapFinancialImpact,
) {
  if (!metadata.userAcceptedBadQuote) {
    throw new FinancialImpactBlockedError(
      'Quote blocked until you explicitly accept the unfavorable market-rate warning.',
      {
        ...financialImpact,
        blocked: true,
        wouldBlock: true,
        reason: 'BAD_QUOTE_NOT_ACCEPTED',
      },
    );
  }

  const acceptedQuoteSourceIdMissing =
    metadata.acceptedQuoteSourceId === undefined ||
    metadata.acceptedQuoteSourceId === null ||
    metadata.acceptedQuoteSourceId === '';
  const acceptedQuoteBuyAmountMissing =
    metadata.acceptedQuoteBuyAmount === undefined ||
    metadata.acceptedQuoteBuyAmount === null ||
    metadata.acceptedQuoteBuyAmount === '';
  if (acceptedQuoteSourceIdMissing || acceptedQuoteBuyAmountMissing) {
    throw new FinancialImpactBlockedError(
      'Quote acceptance is incomplete. Please review and accept again.',
      {
        ...financialImpact,
        blocked: true,
        wouldBlock: true,
        reason: 'BAD_QUOTE_ACCEPTANCE_MISSING',
      },
    );
  }

  if (
    getQuoteAcceptanceIdentifier(metadata.quote) !==
    metadata.acceptedQuoteSourceId
  ) {
    throw new FinancialImpactBlockedError(
      'Quote changed after warning acceptance. Please review and accept again.',
      {
        ...financialImpact,
        blocked: true,
        wouldBlock: true,
        reason: 'BAD_QUOTE_ACCEPTANCE_MISMATCH',
      },
    );
  }

  if (metadata.acceptedQuoteBuyAmount !== metadata.quote.buyAmount) {
    throw new FinancialImpactBlockedError(
      'Quote changed after warning acceptance. Please review and accept again.',
      {
        ...financialImpact,
        blocked: true,
        wouldBlock: true,
        reason: 'BAD_QUOTE_ACCEPTANCE_MISMATCH',
      },
    );
  }
}

export function assertFinancialImpactAllowed(metadata: GuardMetadata): void {
  if (metadata.type !== 'swap-v2') {
    return;
  }
  const swapMetadata = metadata as unknown as SwapV2GuardMetadata;

  const backendFinancialImpact = swapMetadata.quote.financialImpact;
  if (!backendFinancialImpact) {
    return;
  }

  const localFinancialImpact = computeLocalFinancialImpact(swapMetadata);
  if (localFinancialImpact) {
    if (localFinancialImpact.wouldBlock) {
      throw new FinancialImpactBlockedError(
        'Quote blocked due to excessive estimated value loss.',
        localFinancialImpact,
      );
    }

    if (localFinancialImpact.requiresExplicitAcceptance) {
      assertBadQuoteAccepted(swapMetadata, localFinancialImpact);
    }

    return;
  }

  if (!backendFinancialImpact.wouldBlock) {
    if (backendFinancialImpact.requiresExplicitAcceptance) {
      assertBadQuoteAccepted(swapMetadata, backendFinancialImpact);
    }
    return;
  }

  const reason =
    backendFinancialImpact.reason === 'VALUE_LOSS_EXCEEDED'
      ? 'Quote blocked due to excessive estimated value loss.'
      : 'Quote blocked because financial impact could not be verified.';

  throw new FinancialImpactBlockedError(reason, backendFinancialImpact);
}
