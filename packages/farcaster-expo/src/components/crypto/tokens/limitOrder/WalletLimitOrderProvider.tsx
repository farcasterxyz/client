import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiLimitOrder,
  ApiLimitOrderKind,
  ApiPrepareLimitOrderRequestBody,
  ApiPrepareLimitOrderResult,
  ApiTokenLink,
  isUsdc,
} from 'farcaster-client-data';
import {
  buildLimitOrdersKey,
  formatPrice,
  sleep,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import React from 'react';
import {
  encodeFunctionData,
  erc20Abi,
  type Hex,
  isAddress,
  maxUint256,
  parseUnits,
  publicActions,
  zeroAddress,
} from 'viem';

import {
  useEmbeddedWallet,
  useSharedTelemetry,
  useWalletTransactions,
} from '../../../../contexts';
import { useLimitOrdersEnabled, useWalletBalances } from '../../../../hooks';
import {
  isNativeAsset,
  toAnalyticsName,
  tokenLinkToMinimalToken,
  tokenPositionToTokenLink,
  USDC_ADDRESSES,
} from '../../../../utils';
import {
  computeDefaultLimitOrderTargetPrice,
  formatUsdPercentageAmount,
  getDisplayMarketPriceUsd,
  getLimitOrderTargetPriceDecimals,
  maxSellUsdAtTargetPrice,
  sanitizeLimitOrderTargetPriceInput,
  sellUsdAmountExceedsBalance,
  usdAmountExceedsBalance,
} from '../../../../utils/LimitOrderUsdUtils';
import {
  getLimitOrderExpirySeconds,
  getLimitOrderSubmitErrorMessage,
  getLimitOrderUserErrorMessage,
  isRetryableLimitOrderNetworkError,
  LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE,
  type LimitOrderExpiryOption,
} from '../../../../utils/LimitOrderUtils';
import { COW_VAULT_RELAYER } from './cowVaultRelayer';
import { useCowSellTokenApproval } from './useCowSellTokenApproval';

export type WalletLimitOrderParams = {
  kind: ApiLimitOrderKind;
  initialToken?: ApiTokenLink;
};

export type WalletLimitOrderExpiry = LimitOrderExpiryOption;

type WalletLimitOrderState =
  | 'idle'
  | 'preparing'
  | 'approving'
  | 'submitting'
  | 'success'
  | 'error';
type PreparedLimitOrder = ApiPrepareLimitOrderRequestBody & {
  prepared: ApiPrepareLimitOrderResult;
};

type WalletLimitOrderContextType = {
  kind: ApiLimitOrderKind;
  selectedToken: ApiTokenLink | undefined;
  setSelectedToken: (token: ApiTokenLink) => void;
  targetPrice: string;
  setTargetPrice: (value: string) => void;
  amountUsd: string;
  setAmountUsd: (value: string) => void;
  expiry: WalletLimitOrderExpiry;
  setExpiry: (value: WalletLimitOrderExpiry) => void;
  activeInput: 'targetPrice' | 'amountUsd';
  setActiveInput: (value: 'targetPrice' | 'amountUsd') => void;
  fundingToken: ApiTokenLink | undefined;
  setFundingToken: (token: ApiTokenLink) => void;
  availableUsd: number;
  fundingTokenAvailableUsd: number;
  selectedTokenAvailableUsd: number;
  selectedTokenAvailableQuantity: number;
  currentPriceUsd: number | undefined;
  targetPriceMaxDecimals: number;
  percentChange: number | undefined;
  warning: string | undefined;
  error: string | undefined;
  submitError: string | undefined;
  createdOrder: ApiLimitOrder | undefined;
  state: WalletLimitOrderState;
  canSubmit: boolean;
  selectPercentage: (percentage: number) => void;
  prepare: () => Promise<boolean>;
  submit: () => Promise<void>;
};

const WalletLimitOrderContext = React.createContext<
  WalletLimitOrderContextType | undefined
>(undefined);

// Allow CoW / backend RPC nodes to observe the approval before first submit.
const LIMIT_ORDER_POST_APPROVAL_SETTLE_MS = 3_000;
const LIMIT_ORDER_SUBMIT_MAX_ATTEMPTS = 4;
const LIMIT_ORDER_SUBMIT_RETRY_BASE_MS = 2_000;

const isCowSubmitFailure = (order: ApiLimitOrder) => order.status === 'failed';

const getExpirySeconds = (expiry: WalletLimitOrderExpiry) =>
  getLimitOrderExpirySeconds(expiry);

const normalizeNumericInput = (value: string) => {
  if (!value || value === '.') return '0';
  return value;
};

const formatTokenAmount = (value: number, decimals: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return value.toFixed(Math.min(decimals, 18)).replace(/\.?0+$/, '');
};

const buildUsdcTokenLink = ({
  chain,
  ca,
}: {
  chain: ApiTokenLink['chain'];
  ca: string;
}): ApiTokenLink => ({
  chain,
  ca,
  name: 'USD Coin',
  ticker: 'USDC',
  imageUrl: '',
  decimals: 6,
  priceUsd: '1',
});

const isSameChainFundingPosition = ({
  position,
  selectedToken,
}: {
  position: ApiEthFungibleTokenPosition;
  selectedToken: ApiTokenLink;
}) => {
  if (position.chain !== selectedToken.chain) {
    return false;
  }

  const address = position.address;
  if (!address || isNativeAsset(address) || !isAddress(address)) {
    return false;
  }

  return address.toLowerCase() !== selectedToken.ca.toLowerCase();
};

export function WalletLimitOrderProvider({
  children,
  kind,
  initialToken,
}: React.PropsWithChildren<WalletLimitOrderParams>) {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { getWalletClient, evmAddress } = useEmbeddedWallet();
  const { submitTransaction } = useWalletTransactions();
  const { needsSellTokenApproval, waitForSellTokenAllowance } =
    useCowSellTokenApproval();
  const { balances } = useWalletBalances();
  const { trackEvent } = useSharedTelemetry();
  const limitOrdersEnabled = useLimitOrdersEnabled();
  const [selectedToken, setSelectedTokenState] = React.useState<
    ApiTokenLink | undefined
  >(initialToken);
  const [targetPrice, setTargetPrice] = React.useState('0');
  const [selectedFundingToken, setSelectedFundingTokenState] =
    React.useState<ApiTokenLink>();
  const [amountUsd, setAmountUsd] = React.useState('0');
  const [expiry, setExpiry] = React.useState<WalletLimitOrderExpiry>('7d');
  const [activeInput, setActiveInput] = React.useState<
    'targetPrice' | 'amountUsd'
  >('targetPrice');
  const [state, setState] = React.useState<WalletLimitOrderState>('idle');
  const submitInFlightRef = React.useRef(false);
  const [submitError, setSubmitError] = React.useState<string>();
  const [createdOrder, setCreatedOrder] = React.useState<ApiLimitOrder>();
  const [preparedLimitOrder, setPreparedLimitOrder] =
    React.useState<PreparedLimitOrder>();

  React.useEffect(() => {
    if (selectedToken?.priceUsd) {
      const currentPrice = Number(selectedToken.priceUsd);
      setTargetPrice(
        computeDefaultLimitOrderTargetPrice({
          currentPriceUsd: currentPrice,
          kind,
          priceUsd: selectedToken.priceUsd,
        }),
      );
      setAmountUsd('0');
      setSelectedFundingTokenState(undefined);
      setActiveInput('targetPrice');
    }
  }, [kind, selectedToken]);

  const handleSetSelectedToken = React.useCallback(
    (token: ApiTokenLink) => {
      trackEvent(AnalyticsEvent.LimitOrderSelectToken, {
        version: '1',
        kind,
        chain: token.chain,
        token: toAnalyticsName(tokenLinkToMinimalToken(token)),
      });
      setSelectedTokenState(token);
    },
    [kind, trackEvent],
  );

  const handleSetFundingToken = React.useCallback(
    (token: ApiTokenLink) => {
      trackEvent(AnalyticsEvent.LimitOrderSelectFundingToken, {
        version: '1',
        kind,
        chain: token.chain,
        fundingToken: toAnalyticsName(tokenLinkToMinimalToken(token)),
      });
      setSelectedFundingTokenState(token);
    },
    [kind, trackEvent],
  );

  const handleSetActiveInput = React.useCallback(
    (value: 'targetPrice' | 'amountUsd') => {
      setActiveInput(value);
    },
    [],
  );

  const currentPriceUsd = React.useMemo(() => {
    if (!selectedToken?.priceUsd) return undefined;
    const parsed = Number(selectedToken.priceUsd);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [selectedToken]);

  const displayMarketPriceUsd = React.useMemo(() => {
    if (currentPriceUsd === undefined) return undefined;
    return getDisplayMarketPriceUsd(selectedToken?.priceUsd, currentPriceUsd);
  }, [currentPriceUsd, selectedToken?.priceUsd]);

  const targetPriceMaxDecimals = React.useMemo(() => {
    if (currentPriceUsd === undefined) {
      return getLimitOrderTargetPriceDecimals(0);
    }
    return getLimitOrderTargetPriceDecimals(
      currentPriceUsd,
      selectedToken?.priceUsd,
    );
  }, [currentPriceUsd, selectedToken?.priceUsd]);

  const selectedTokenPosition = React.useMemo(() => {
    if (!selectedToken) return undefined;
    return balances.find(
      (balance) =>
        balance.chain === selectedToken.chain &&
        balance.address?.toLowerCase() === selectedToken.ca.toLowerCase(),
    );
  }, [balances, selectedToken]);

  const sameChainFundingPositions = React.useMemo(() => {
    if (!selectedToken) return [];

    return balances
      .filter((position) =>
        isSameChainFundingPosition({ position, selectedToken }),
      )
      .sort((a, b) => {
        if (isUsdc(a.address) && !isUsdc(b.address)) return -1;
        if (!isUsdc(a.address) && isUsdc(b.address)) return 1;
        return (b.value ?? 0) - (a.value ?? 0);
      });
  }, [balances, selectedToken]);

  const quoteTokenPosition = React.useMemo(() => {
    if (selectedFundingToken) {
      return balances.find(
        (balance) =>
          balance.chain === selectedFundingToken.chain &&
          balance.address?.toLowerCase() ===
            selectedFundingToken.ca.toLowerCase(),
      );
    }
    if (!selectedToken) return undefined;
    return sameChainFundingPositions[0];
  }, [
    balances,
    sameChainFundingPositions,
    selectedFundingToken,
    selectedToken,
  ]);

  const selectedTokenAvailableUsd =
    selectedTokenPosition?.value ??
    selectedToken?.walletContext?.position.valueUsd ??
    0;
  const selectedTokenAvailableQuantity =
    selectedTokenPosition?.quantity.float ??
    selectedToken?.walletContext?.position.quantity.float ??
    0;
  const fundingTokenAvailableUsd = quoteTokenPosition?.value ?? 0;
  const parsedTargetPrice = Number(normalizeNumericInput(targetPrice));
  const parsedAmountUsd = Number(normalizeNumericInput(amountUsd));
  const availableUsd =
    kind === 'buy'
      ? fundingTokenAvailableUsd
      : maxSellUsdAtTargetPrice(
          selectedTokenAvailableQuantity,
          parsedTargetPrice,
        );
  const fundingTokenLink = React.useMemo(() => {
    if (selectedFundingToken) return selectedFundingToken;
    if (quoteTokenPosition) return tokenPositionToTokenLink(quoteTokenPosition);
    if (kind === 'sell' && selectedToken) {
      const usdcAddress = USDC_ADDRESSES[selectedToken.chain];
      if (usdcAddress) {
        return buildUsdcTokenLink({
          chain: selectedToken.chain,
          ca: usdcAddress,
        });
      }
    }
    return undefined;
  }, [kind, quoteTokenPosition, selectedFundingToken, selectedToken]);

  const percentChange = React.useMemo(() => {
    if (!displayMarketPriceUsd || !parsedTargetPrice) return undefined;
    return (
      ((parsedTargetPrice - displayMarketPriceUsd) / displayMarketPriceUsd) *
      100
    );
  }, [displayMarketPriceUsd, parsedTargetPrice]);

  const analyticsProperties = React.useMemo(
    () => ({
      version: '1',
      kind,
      chain: selectedToken?.chain,
      token: selectedToken
        ? toAnalyticsName(tokenLinkToMinimalToken(selectedToken))
        : undefined,
      fundingToken: fundingTokenLink
        ? toAnalyticsName(tokenLinkToMinimalToken(fundingTokenLink))
        : undefined,
      amountUsd: parsedAmountUsd,
      targetPriceUsd: parsedTargetPrice,
      percentChange,
      expiry,
    }),
    [
      expiry,
      fundingTokenLink,
      kind,
      parsedAmountUsd,
      parsedTargetPrice,
      percentChange,
      selectedToken,
    ],
  );

  const validation = React.useMemo(() => {
    if (!limitOrdersEnabled) {
      return { error: LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE };
    }
    if (!selectedToken) {
      return { error: `Choose a token to ${kind === 'buy' ? 'buy' : 'sell'}` };
    }
    if (selectedToken.features?.canLimitOrder !== true) {
      return {
        error: `Limit ${kind === 'buy' ? 'buy' : 'sell'} is not available for this token`,
      };
    }
    if (!displayMarketPriceUsd) return { error: 'Token price is unavailable' };
    if (!parsedTargetPrice || parsedTargetPrice <= 0) {
      return { error: 'Enter a target price' };
    }
    if (kind === 'buy' && parsedTargetPrice > displayMarketPriceUsd) {
      return {
        error: `Limit Buy must be below ${formatPrice(displayMarketPriceUsd)}`,
      };
    }
    if (kind === 'sell' && parsedTargetPrice < displayMarketPriceUsd) {
      return {
        error: `Limit Sell must be above ${formatPrice(displayMarketPriceUsd)}`,
      };
    }
    if (!parsedAmountUsd || parsedAmountUsd <= 0) {
      return { error: `Enter an amount to ${kind}` };
    }
    if (isNativeAsset(selectedToken.ca) || !isAddress(selectedToken.ca)) {
      return { error: 'Limit orders require an ERC-20 token' };
    }
    if (!fundingTokenLink) return { error: 'Choose a funding token' };
    if (fundingTokenLink.chain !== selectedToken.chain) {
      return { error: 'Funding token must be on the same chain' };
    }
    if (isNativeAsset(fundingTokenLink.ca) || !isAddress(fundingTokenLink.ca)) {
      return { error: 'Limit orders require an ERC-20 funding token' };
    }
    if (!fundingTokenLink.priceUsd) {
      return { error: 'Funding token price is unavailable' };
    }
    if (!evmAddress) return { error: 'Wallet is not connected' };
    if (
      kind === 'buy' &&
      usdAmountExceedsBalance(parsedAmountUsd, availableUsd)
    ) {
      return { error: 'Amount exceeds available balance' };
    }
    if (
      kind === 'sell' &&
      sellUsdAmountExceedsBalance(
        parsedAmountUsd,
        parsedTargetPrice,
        selectedTokenAvailableQuantity,
      )
    ) {
      return { error: 'Amount exceeds available balance' };
    }
    if (kind === 'buy' && percentChange !== undefined && percentChange <= -90) {
      return { warning: 'Price is more than 90% below market.' };
    }
    if (kind === 'sell' && percentChange !== undefined && percentChange >= 90) {
      return { warning: 'Price is more than 90% above market.' };
    }
    return {};
  }, [
    availableUsd,
    displayMarketPriceUsd,
    evmAddress,
    fundingTokenLink,
    kind,
    limitOrdersEnabled,
    parsedAmountUsd,
    parsedTargetPrice,
    percentChange,
    selectedToken,
    selectedTokenAvailableQuantity,
  ]);

  const selectPercentage = React.useCallback(
    (percentage: number) => {
      setAmountUsd(formatUsdPercentageAmount(availableUsd, percentage));
      handleSetActiveInput('amountUsd');
    },
    [availableUsd, handleSetActiveInput],
  );

  const handleSetTargetPrice = React.useCallback(
    (value: string) => {
      const sanitized = sanitizeLimitOrderTargetPriceInput(
        value,
        targetPriceMaxDecimals,
      );
      setTargetPrice(sanitized);
      if (kind === 'sell' && sanitized !== targetPrice) {
        setAmountUsd('0');
      }
    },
    [kind, targetPrice, targetPriceMaxDecimals],
  );

  const handleSetAmountUsd = React.useCallback((value: string) => {
    setAmountUsd(value);
  }, []);

  const fundingTokenIdentifier = React.useMemo(
    () =>
      fundingTokenLink
        ? `${fundingTokenLink.chain}:${fundingTokenLink.ca}`
        : undefined,
    [fundingTokenLink],
  );

  React.useEffect(() => {
    setPreparedLimitOrder(undefined);
    setSubmitError(undefined);
  }, [
    evmAddress,
    expiry,
    fundingTokenIdentifier,
    kind,
    parsedAmountUsd,
    parsedTargetPrice,
    selectedToken,
  ]);

  const buildPreparedLimitOrderRequest = React.useCallback(async () => {
    if (
      validation.error ||
      !selectedToken ||
      !fundingTokenLink ||
      !evmAddress
    ) {
      throw new Error('Review limit order before placing');
    }

    const sellTokenLink = kind === 'buy' ? fundingTokenLink : selectedToken;
    const buyTokenLink = kind === 'buy' ? selectedToken : fundingTokenLink;
    const sellTokenDecimals = sellTokenLink.decimals ?? 18;
    const buyTokenDecimals = buyTokenLink.decimals ?? 18;
    const buyTokenPriceUsd =
      kind === 'buy' ? parsedTargetPrice : Number(fundingTokenLink.priceUsd);
    const sellTokenPriceUsd =
      kind === 'buy' ? Number(fundingTokenLink.priceUsd) : parsedTargetPrice;
    const sellAmount = parseUnits(
      formatTokenAmount(parsedAmountUsd / sellTokenPriceUsd, sellTokenDecimals),
      sellTokenDecimals,
    ).toString();
    const buyAmount = parseUnits(
      formatTokenAmount(parsedAmountUsd / buyTokenPriceUsd, buyTokenDecimals),
      buyTokenDecimals,
    ).toString();
    const validTo = getExpirySeconds(expiry);
    const receiver = evmAddress === zeroAddress ? undefined : evmAddress;
    const prepareBody = {
      chain: selectedToken.chain,
      sellCa: sellTokenLink.ca,
      buyCa: buyTokenLink.ca,
      sellAmount,
      buyAmount,
      kind,
      validTo,
      swapper: evmAddress,
      receiver,
      partiallyFillable: false,
    };
    const preparedResponse = await apiClient.prepareLimitOrder(prepareBody);
    return {
      chain: selectedToken.chain,
      sellCa: sellTokenLink.ca,
      buyCa: buyTokenLink.ca,
      sellAmount,
      buyAmount,
      kind,
      validTo,
      swapper: evmAddress,
      receiver,
      partiallyFillable: false,
      prepared: preparedResponse.data.result,
    } satisfies PreparedLimitOrder;
  }, [
    apiClient,
    evmAddress,
    expiry,
    fundingTokenLink,
    kind,
    parsedAmountUsd,
    parsedTargetPrice,
    selectedToken,
    validation.error,
  ]);

  const prepareLimitOrder = React.useCallback(async () => {
    try {
      setState('preparing');
      setSubmitError(undefined);
      setPreparedLimitOrder(undefined);
      const prepared = await buildPreparedLimitOrderRequest();
      setPreparedLimitOrder(prepared);
      setState('idle');
      return prepared;
    } catch (error) {
      trackEvent(AnalyticsEvent.LimitOrderPrepareError, {
        ...analyticsProperties,
        error: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : 'Order failed',
      });
      setSubmitError(getLimitOrderUserErrorMessage(error, 'Order failed'));
      setState('error');
      return undefined;
    }
  }, [analyticsProperties, buildPreparedLimitOrderRequest, trackEvent]);

  const prepare = React.useCallback(async () => {
    return (await prepareLimitOrder()) !== undefined;
  }, [prepareLimitOrder]);

  const upsertCreatedOrderInCache = React.useCallback(
    (order: ApiLimitOrder) => {
      setCreatedOrder(order);
      queryClient.setQueryData<
        InfiniteData<{
          items: ApiLimitOrder[];
          next?: { cursor?: string };
        }>
      >(buildLimitOrdersKey(), (data) => {
        if (!data) {
          return {
            pages: [{ items: [order] }],
            pageParams: [undefined],
          };
        }

        const [firstPage, ...restPages] = data.pages;
        const filteredItems = (firstPage?.items ?? []).filter(
          (cachedOrder) => cachedOrder.id !== order.id,
        );

        return {
          ...data,
          pages: [
            {
              ...firstPage,
              items: [order, ...filteredItems],
            },
            ...restPages,
          ],
        };
      });
      void queryClient.invalidateQueries({
        queryKey: buildLimitOrdersKey(),
        refetchType: 'none',
      });
    },
    [queryClient],
  );

  const signPreparedLimitOrder = React.useCallback(
    async (orderToCreate: PreparedLimitOrder) => {
      if (!evmAddress) {
        throw new Error('Review limit order before placing');
      }

      const chain = apiChainToViemChainOrThrow(orderToCreate.chain);
      const walletClient = await getWalletClient(chain);
      const prepared = orderToCreate.prepared;

      return walletClient.signTypedData(
        prepared.signaturePayload.typedData as Parameters<
          typeof walletClient.signTypedData
        >[0],
      );
    },
    [evmAddress, getWalletClient],
  );

  const submitSignedLimitOrder = React.useCallback(
    async (
      orderToCreate: PreparedLimitOrder,
      signature: string,
      { updateCache = true }: { updateCache?: boolean } = {},
    ) => {
      const prepared = orderToCreate.prepared;
      const createBody = {
        chain: orderToCreate.chain,
        sellCa: orderToCreate.sellCa,
        buyCa: orderToCreate.buyCa,
        sellAmount: orderToCreate.sellAmount,
        buyAmount: orderToCreate.buyAmount,
        kind: orderToCreate.kind,
        validTo: orderToCreate.validTo,
        swapper: orderToCreate.swapper,
        receiver: orderToCreate.receiver,
        partiallyFillable: orderToCreate.partiallyFillable,
        signature,
        signatureHash: prepared.signatureHash,
        signaturePayload: prepared.signaturePayload,
        metadata: {
          source: 'farcaster-mobile',
          targetPriceUsd: parsedTargetPrice,
          amountUsd: parsedAmountUsd,
          expiry,
        },
      };
      const response = await apiClient.createLimitOrder(createBody);
      const order = response.data.result.order;
      if (updateCache) {
        upsertCreatedOrderInCache(order);
      }
      return order;
    },
    [
      apiClient,
      expiry,
      parsedAmountUsd,
      parsedTargetPrice,
      upsertCreatedOrderInCache,
    ],
  );

  const refreshPreparedLimitOrderForSubmit = React.useCallback(
    async (reviewedOrder: PreparedLimitOrder) => {
      const validTo = getExpirySeconds(expiry);
      if (validTo === reviewedOrder.validTo) {
        return reviewedOrder;
      }

      const prepareBody = {
        chain: reviewedOrder.chain,
        sellCa: reviewedOrder.sellCa,
        buyCa: reviewedOrder.buyCa,
        sellAmount: reviewedOrder.sellAmount,
        buyAmount: reviewedOrder.buyAmount,
        kind: reviewedOrder.kind,
        validTo,
        swapper: reviewedOrder.swapper,
        receiver: reviewedOrder.receiver,
        partiallyFillable: reviewedOrder.partiallyFillable,
      };
      const preparedResponse = await apiClient.prepareLimitOrder(prepareBody);
      return {
        ...reviewedOrder,
        validTo,
        prepared: preparedResponse.data.result,
      } satisfies PreparedLimitOrder;
    },
    [apiClient, expiry],
  );

  const submitPreparedWithRetries = React.useCallback(
    async (reviewedOrder: PreparedLimitOrder) => {
      const orderToCreate =
        await refreshPreparedLimitOrderForSubmit(reviewedOrder);
      setPreparedLimitOrder(orderToCreate);
      const signature = await signPreparedLimitOrder(orderToCreate);
      let lastOrder: ApiLimitOrder | undefined;

      for (
        let attempt = 0;
        attempt < LIMIT_ORDER_SUBMIT_MAX_ATTEMPTS;
        attempt++
      ) {
        if (attempt > 0) {
          await sleep(LIMIT_ORDER_SUBMIT_RETRY_BASE_MS * 2 ** (attempt - 1));
        }

        setState('submitting');
        const isLastAttempt = attempt === LIMIT_ORDER_SUBMIT_MAX_ATTEMPTS - 1;

        try {
          lastOrder = await submitSignedLimitOrder(orderToCreate, signature, {
            updateCache: false,
          });
        } catch (error) {
          if (!isLastAttempt && isRetryableLimitOrderNetworkError(error)) {
            continue;
          }
          throw error;
        }

        if (isCowSubmitFailure(lastOrder)) {
          upsertCreatedOrderInCache(lastOrder);
          break;
        }

        upsertCreatedOrderInCache(lastOrder);
        trackEvent(AnalyticsEvent.LimitOrderPlaceOrderSucceeded, {
          ...analyticsProperties,
          orderId: lastOrder.id,
          status: lastOrder.status,
          submitAttempt: attempt + 1,
        });
        setState('success');
        return;
      }

      throw new Error(
        lastOrder?.errorMessage ??
          'Limit order failed to submit. Please try again.',
      );
    },
    [
      analyticsProperties,
      refreshPreparedLimitOrderForSubmit,
      signPreparedLimitOrder,
      submitSignedLimitOrder,
      trackEvent,
      upsertCreatedOrderInCache,
    ],
  );

  const submit = React.useCallback(async () => {
    if (validation.error || !selectedToken || !evmAddress) return;
    if (!preparedLimitOrder) {
      setSubmitError('Review limit order before placing');
      return;
    }
    if (submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setSubmitError(undefined);
    setState('submitting');
    trackEvent(AnalyticsEvent.LimitOrderPlaceOrder, analyticsProperties);

    const sellTokenTicker =
      preparedLimitOrder.kind === 'buy'
        ? (fundingTokenLink?.ticker ?? 'token')
        : (selectedToken.ticker ?? 'token');

    const runCreateAfterApproval = async ({
      chain,
      tokenCa,
      owner,
      requiredAmount,
      approvalTxHash,
      orderToCreate,
    }: {
      chain: ApiLimitOrder['chain'];
      tokenCa: string;
      owner: Hex;
      requiredAmount: bigint;
      approvalTxHash: Hex;
      orderToCreate: PreparedLimitOrder;
    }) => {
      await waitForSellTokenAllowance({
        chain,
        tokenCa,
        owner,
        requiredAmount,
        approvalTxHash,
      });
      await sleep(LIMIT_ORDER_POST_APPROVAL_SETTLE_MS);
      await submitPreparedWithRetries(orderToCreate);
    };

    const submitApprovalTransaction = () =>
      new Promise<Hex>((resolve, reject) => {
        const viemChain = apiChainToViemChainOrThrow(preparedLimitOrder.chain);
        submitTransaction({
          protocol: 'ethereum',
          chain: preparedLimitOrder.chain,
          metadata: {
            type: 'limit-order-approval',
            tokenCa: preparedLimitOrder.sellCa,
            tokenTicker: sellTokenTicker,
          },
          buildTransaction: async () => {
            const walletClient = await getWalletClient(viemChain);
            const approvalData = encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [COW_VAULT_RELAYER, maxUint256],
            });

            await walletClient.extend(publicActions).simulateContract({
              address: preparedLimitOrder.sellCa as Hex,
              abi: erc20Abi,
              functionName: 'approve',
              args: [COW_VAULT_RELAYER, maxUint256],
              account: walletClient.account,
            });

            return {
              account: walletClient.account,
              chain: viemChain,
              data: approvalData,
              to: preparedLimitOrder.sellCa as Hex,
            };
          },
          onExecute: () => {
            trackEvent(
              AnalyticsEvent.LimitOrderApprovalTransaction,
              analyticsProperties,
            );
          },
          onSuccess: (txHash) => resolve(txHash as Hex),
          onError: (error, txHash) => {
            if (error) {
              trackEvent(AnalyticsEvent.LimitOrderApprovalTransactionError, {
                ...analyticsProperties,
                error: error.name,
                message: error.message,
              });
            } else if (txHash) {
              trackEvent(
                AnalyticsEvent.LimitOrderApprovalTransactionReverted,
                analyticsProperties,
              );
            }
            reject(error ?? new Error('Approval failed'));
          },
        });
      });

    try {
      const requiredAmount = BigInt(preparedLimitOrder.sellAmount);
      const requiresApproval = await needsSellTokenApproval({
        chain: preparedLimitOrder.chain,
        tokenCa: preparedLimitOrder.sellCa,
        owner: evmAddress as Hex,
        requiredAmount,
      });

      if (!requiresApproval) {
        await submitPreparedWithRetries(preparedLimitOrder);
        return;
      }

      setState('approving');
      const approvalTxHash = await submitApprovalTransaction();
      trackEvent(
        AnalyticsEvent.LimitOrderApprovalTransactionSucceeded,
        analyticsProperties,
      );
      await runCreateAfterApproval({
        chain: preparedLimitOrder.chain,
        tokenCa: preparedLimitOrder.sellCa,
        owner: evmAddress as Hex,
        requiredAmount,
        approvalTxHash,
        orderToCreate: preparedLimitOrder,
      });
    } catch (error) {
      trackEvent(AnalyticsEvent.LimitOrderPlaceOrderError, {
        ...analyticsProperties,
        error: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : 'Order failed',
      });
      setSubmitError(
        getLimitOrderSubmitErrorMessage(
          error,
          preparedLimitOrder?.chain ?? selectedToken?.chain,
        ),
      );
      setState('error');
    } finally {
      submitInFlightRef.current = false;
    }
  }, [
    analyticsProperties,
    evmAddress,
    fundingTokenLink?.ticker,
    getWalletClient,
    needsSellTokenApproval,
    waitForSellTokenAllowance,
    preparedLimitOrder,
    selectedToken,
    submitPreparedWithRetries,
    submitTransaction,
    trackEvent,
    validation.error,
  ]);

  const value = React.useMemo(
    () => ({
      kind,
      selectedToken,
      setSelectedToken: handleSetSelectedToken,
      targetPrice,
      setTargetPrice: handleSetTargetPrice,
      amountUsd,
      setAmountUsd: handleSetAmountUsd,
      expiry,
      setExpiry,
      activeInput,
      setActiveInput: handleSetActiveInput,
      fundingToken: fundingTokenLink,
      setFundingToken: handleSetFundingToken,
      availableUsd,
      fundingTokenAvailableUsd,
      selectedTokenAvailableUsd,
      selectedTokenAvailableQuantity,
      currentPriceUsd,
      targetPriceMaxDecimals,
      percentChange,
      warning: validation.warning,
      error: validation.error,
      submitError,
      createdOrder,
      state,
      canSubmit:
        !validation.error &&
        state !== 'preparing' &&
        state !== 'approving' &&
        state !== 'submitting',
      selectPercentage,
      prepare,
      submit,
    }),
    [
      activeInput,
      amountUsd,
      availableUsd,
      createdOrder,
      fundingTokenAvailableUsd,
      selectedTokenAvailableQuantity,
      selectedTokenAvailableUsd,
      currentPriceUsd,
      targetPriceMaxDecimals,
      expiry,
      fundingTokenLink,
      handleSetActiveInput,
      handleSetAmountUsd,
      handleSetFundingToken,
      handleSetSelectedToken,
      handleSetTargetPrice,
      kind,
      percentChange,
      prepare,
      selectPercentage,
      selectedToken,
      state,
      submit,
      submitError,
      targetPrice,
      validation.error,
      validation.warning,
    ],
  );

  return (
    <WalletLimitOrderContext.Provider value={value}>
      {children}
    </WalletLimitOrderContext.Provider>
  );
}

export function useWalletLimitOrder() {
  const context = React.useContext(WalletLimitOrderContext);
  if (!context) {
    throw new Error('useWalletLimitOrder requires WalletLimitOrderProvider');
  }
  return context;
}
