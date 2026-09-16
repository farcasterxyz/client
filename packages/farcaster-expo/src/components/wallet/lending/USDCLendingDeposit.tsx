import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiOnchainMorphoVault,
  ApiTokenLink,
  getUsdcAddress,
} from 'farcaster-client-data';
import {
  formatPrice,
  sleep,
  tokenQuantityToFloat,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import {
  Check,
  CircleAlertIcon,
  TriangleAlertIcon,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { erc20Abi, formatUnits, parseUnits } from 'viem';

import {
  useEmbeddedWallet,
  usePublicClient,
  useSharedTelemetry,
  useTheme,
  useWalletTransactions,
} from '../../../contexts';
import { useWalletRefresh } from '../../../hooks';
import { useMorphoDeposit } from '../../../hooks/useMorphoDeposit';
import { tokenPositionToTokenLink } from '../../../utils';
import { TokenIcon } from '../../crypto';
import {
  formatNumPadValue,
  NumpadWithQuickSelect,
} from '../../crypto/tokens/swap/Numpad';
import { useSwapQuotes } from '../../crypto/tokens/swap/useSwapQuotes';
import {
  AnimatedPressable,
  HoldToTransactButton,
  LoadingIndicator,
  Text2,
  TextPlaceholder,
} from '../../design-system';
import { CoinStackIcon } from '../../icons';
import { WalletScreenHeader } from '../WalletScreenHeader';
import { USDCLendingFeeDetailsBottomSheetModal } from './USDCLendingFeeDetailsBottomSheetModal';

const baseUsdcAddress = getUsdcAddress('base')! as `0x${string}`;

const baseUsdc: ApiTokenLink = {
  chain: 'base',
  ca: baseUsdcAddress,
  name: 'USD Coin',
  ticker: 'USDC',
  decimals: 6,
  imageUrl: '',
  priceUsd: '1',
};

type DepositPhase =
  | 'idle'
  | 'waiting'
  | 'bridge-complete'
  | 'bridge-error'
  | 'depositing'
  | 'deposit-complete'
  | 'deposit-error';

export function USDCLendingDeposit({
  token,
  vault,
  goBack,
}: {
  token: ApiEthFungibleTokenPosition;
  vault: ApiOnchainMorphoVault;
  goBack: () => void;
}) {
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewUSDCLendingDeposit, {
      chain: token.chain,
    });
  }, [trackEvent, token.chain]);

  const refreshWallet = useWalletRefresh();
  const recordWalletTransaction = useRecordWalletTransaction();

  const { evmAddress } = useEmbeddedWallet();
  const { prepareAction } = useWalletTransactions();
  const { getEthereumClient } = usePublicClient();

  // Whether the source token is not on Base (needs bridging)
  const needsBridge = token.chain !== 'base';

  const phaseRef = React.useRef<DepositPhase>('idle');
  const [phase, _setPhaseInternal] = React.useState<DepositPhase>('idle');
  const [amountText, setAmountText] = React.useState('0');
  const [showFeeDetails, setShowFeeDetails] = React.useState(false);

  const setPhase = React.useCallback((newPhase: DepositPhase) => {
    phaseRef.current = newPhase;
    _setPhaseInternal(newPhase);
  }, []);

  const maxAmountText = React.useMemo(() => {
    const value = token.value ?? 0;
    return (Math.round(value * 100) / 100).toFixed(2);
  }, [token.value]);

  const insufficientBalance = React.useMemo(() => {
    return parseFloat(amountText) > parseFloat(maxAmountText);
  }, [amountText, maxAmountText]);

  const amount = React.useMemo(() => {
    if (amountText === maxAmountText) {
      return BigInt(token.quantity.int);
    }

    const parsed = parseFloat(amountText);
    if (isNaN(parsed) || parsed < 0) {
      return 0n;
    }

    return parseUnits(amountText, 6);
  }, [amountText, maxAmountText, token.quantity.int]);

  const baseClient = useMemo(
    () => getEthereumClient({ chain: apiChainToViemChainOrThrow('base') }),
    [getEthereumClient],
  );

  const {
    data: actions,
    fundGas: depositFundGas,
    fundGasQuote: depositFundGasQuote,
    fundGasCoverAmountUsd: depositFundGasCoverAmountUsd,
    estimatedFeeUsd: estimatedDepositFeeUsd,
    insufficientFunds: insufficientDepositFunds,
    estimatedFeeUsdPending: estimatedDepositFeeUsdPending,
  } = useMorphoDeposit({
    chain: 'base',
    ca: vault.ca as `0x${string}`,
    address: evmAddress as `0x${string}`,
    amount: amount,
  });

  // Memoize to avoid infinite re-renders
  const sellToken = useMemo(() => tokenPositionToTokenLink(token), [token]);
  const buyToken = useMemo(() => baseUsdc, []);
  const swapState = useMemo(() => ({ state: 'pending' as const }), []);

  // Execute the deposit to the Morpho vault
  const executeDeposit = useCallback(async () => {
    const metadata = {
      type: 'morpho-deposit' as const,
      vault: vault,
      chain: 'base' as const,
      ca: baseUsdcAddress,
      amount: amount.toString(),
      actions: actions,
    };

    const action = prepareAction({
      protocol: 'actions',
      chain: 'base',
      toast: false,
      actions: actions,
      metadata: metadata,

      // Trigger any applicable required gasless swap
      beforeExecute: depositFundGas,

      onExecute: () => setPhase('depositing'),
      onError: () => {
        trackEvent(AnalyticsEvent.USDCLendingDepositError, {
          chain: token.chain,
        });
        setPhase('deposit-error');
      },
      onSuccess: async (txHash: string) => {
        trackEvent(AnalyticsEvent.USDCLendingDepositSuccess, {
          chain: token.chain,
        });
        try {
          Promise.all([
            await recordWalletTransaction({
              params: {
                ethAddress: evmAddress as `0x${string}`,
                ethTxHash: txHash,
                ethChainId: Number(apiChainToChainIdOrThrow('base')),
                metadata: { ...metadata, status: 'succeeded' },
              },
            }),
            await refreshWallet(
              [
                {
                  chain: vault.chain,
                  ca: vault.ca,
                  decimals: 18,

                  // In case this user doens't have a position, insert a template
                  position: {
                    id: `${vault.chain}:${vault.ca}`,
                    chain: vault.chain,
                    quantity: {
                      float: parseFloat(amountText),
                      int: parseUnits(amountText, 18).toString(),
                    },
                    name: vault.name,
                    symbol: vault.name,
                    decimals: 18,
                    price: vault.sharePriceUsd,
                    address: vault.ca,
                    hidden: true,
                    features: { canTrade: false, isTestnet: false },
                    token: {
                      name: vault.name,
                      ticker: vault.name,
                      ca: vault.ca,
                      chain: vault.chain,
                      decimals: 18,
                      imageUrl: '',
                    },
                  },
                },
                { chain: 'base', ca: baseUsdcAddress, decimals: 6 },
                { chain: token.chain, ...token.token },
              ],
              true,
            ),
          ]);
        } finally {
          setPhase('deposit-complete');
        }
      },
    });

    action.submit();
  }, [
    actions,
    depositFundGas,
    amount,
    amountText,
    vault,
    evmAddress,
    prepareAction,
    refreshWallet,
    token,
    setPhase,
    recordWalletTransaction,
    trackEvent,
  ]);

  React.useEffect(() => {
    // Protect against executing the deposit twice.
    if (phaseRef.current !== 'bridge-complete') {
      return;
    }

    // Update ref immediately to prevent double execution
    phaseRef.current = 'depositing';

    // Post-Bridge, execute the deposit.
    setPhase('depositing');
    executeDeposit();
  }, [executeDeposit, setPhase]);

  // Stable callbacks for useSwapQuotes to avoid infinite re-renders
  const onBridgeExecuted = useCallback(() => setPhase('waiting'), [setPhase]);
  const onBridgeError = useCallback(() => setPhase('bridge-error'), [setPhase]);
  const onBridgeSuccess = useCallback(async () => {
    // Up to 10c below the bridged amount
    const minExpectedBalance = amount - 100000n;

    let tries = 0;
    do {
      const balance = await baseClient.readContract({
        address: baseUsdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [evmAddress as `0x${string}`],
      });

      if (balance >= minExpectedBalance) {
        const amountToUse = balance >= amount ? amount : minExpectedBalance;
        setAmountText(formatUnits(amountToUse, 6));
        setPhase('bridge-complete');
        return;
      }

      tries++;
      await sleep(1_000);
    } while (tries < 10);

    setPhase('bridge-error');
    return;
  }, [amount, evmAddress, baseClient, setAmountText, setPhase]);

  const {
    preparedQuote: bridgeQuote,
    fundGasQuote: bridgeFundGasQuote,
    isFetching: isFetchingBridgeQuote,
    quoteError: bridgeQuoteError,
  } = useSwapQuotes({
    sellToken: needsBridge ? sellToken : undefined,
    buyToken: needsBridge ? buyToken : undefined,
    sellTokenBalance: needsBridge ? token.quantity.int : undefined,
    sellAmount: formatUnits(amount, token.decimals ?? 6),
    platformType: 'mobile',
    onSwapExecuted: onBridgeExecuted,
    onSuccess: onBridgeSuccess,
    onError: onBridgeError,
    quickSwap: false,
    state: swapState,
    usdcDenominatedSwaps: false,
    assetPickerType: 'crypto',
  });

  const bridgeFundGasCoverAmountUsd = useMemo(() => {
    if (!bridgeFundGasQuote?.success) {
      return undefined;
    }

    const price = bridgeFundGasQuote.price.sell.token.price;
    if (!price) {
      return 0;
    }

    const amount = parseFloat(
      formatUnits(
        BigInt(bridgeFundGasQuote.price.sell.amount ?? 0),
        bridgeFundGasQuote.price.sell.token.decimals ?? 18,
      ),
    );

    return price * amount;
  }, [bridgeFundGasQuote]);

  const onConfirm = useCallback(async () => {
    if (phaseRef.current !== 'idle') {
      return;
    }

    // Update ref immediately to prevent double execution

    // Button is disabled without the quote so
    // should safe to move into the waiting phase.
    if (needsBridge) {
      phaseRef.current = 'waiting';
      setPhase('waiting');
      bridgeQuote?.action.submit();
      return;
    }

    // Direct deposit flow (token is already on Base)
    phaseRef.current = 'waiting';
    setPhase('depositing');
    await executeDeposit();
  }, [needsBridge, bridgeQuote, executeDeposit, setPhase]);

  const { estimatedFeesUsd, insufficientFunds, estimatedFeeUsdPending } =
    useMemo(() => {
      // NO BRIDGE NEEDED //

      if (!needsBridge) {
        return {
          estimatedFeesUsd: estimatedDepositFeeUsd,
          insufficientFunds: insufficientDepositFunds,
          estimatedFeeUsdPending: estimatedDepositFeeUsdPending,
        };
      }

      // BRIDGE NEEDED //

      // Loading Quote (both bridge & deposit)
      if (isFetchingBridgeQuote || estimatedDepositFeeUsdPending) {
        return {
          estimatedFeesUsd: undefined,
          insufficientFunds: undefined,
          estimatedFeeUsdPending: true,
        };
      }

      if (!bridgeQuote?.quote.success) {
        return {
          estimatedFeesUsd: undefined,
          insufficientFunds: undefined,
          estimatedFeeUsdPending: false,
        };
      }

      const spread = amount - BigInt(bridgeQuote.quote.buyAmount);
      const bridgeFeesUsd = tokenQuantityToFloat({
        quantity: spread,
        decimals: token.decimals ?? 6,
        strategy: 'exact',
      });

      const totalFeesUsd = (estimatedDepositFeeUsd ?? 0) + bridgeFeesUsd;
      return {
        estimatedFeesUsd: totalFeesUsd,
        insufficientFunds: insufficientDepositFunds ?? false,
        estimatedFeeUsdPending: estimatedDepositFeeUsdPending ?? false,
      };
    }, [
      amount,
      token,
      needsBridge,
      bridgeQuote,
      isFetchingBridgeQuote,
      estimatedDepositFeeUsd,
      insufficientDepositFunds,
      estimatedDepositFeeUsdPending,
    ]);

  const DoneButton = React.useMemo(() => {
    return (
      <View style={[t.pX3, t.pY6, { marginBottom: 10 }]}>
        <AnimatedPressable
          onPress={goBack}
          style={[
            t.roundedFull,
            t.itemsCenter,
            t.justifyCenter,
            t.backgrounds.brand,
            { height: 48 },
          ]}
        >
          <Text2 size="lg" weight="semibold" color="light">
            Done
          </Text2>
        </AnimatedPressable>
      </View>
    );
  }, [t, goBack]);

  return (
    <View style={[t.flex1, t.flexCol]}>
      <WalletScreenHeader title="Deposit" onBackCallback={goBack} />
      <View style={[t.flexRow, t.itemsCenter, t.p3, { gap: 8 }]}>
        <TokenIcon diameter={40} symbol="USDC" chain={token.chain} />
        <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
          <Text2 color="primary" weight="semibold" numberOfLines={1}>
            USDC
          </Text2>
          <Text2 size="sm" color="tertiary" weight="semibold">
            {token.quantity.float.toFixed(2)} USDC
          </Text2>
        </View>
        <Text2 color="primary" weight="semibold" numberOfLines={1}>
          {formatPrice(token.value ?? 0)}
        </Text2>
      </View>

      {/* Amount display */}
      <View style={[t.flex1, t.justifyCenter, t.itemsCenter, { gap: 8 }]}>
        <Text2 weight="semibold" color="primary" size="6xl">
          ${formatNumPadValue(amountText)}
        </Text2>
        {/* Gasless Bridge Conversion text */}
        {bridgeFundGasQuote?.success && (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <CircleAlertIcon size={14} color={t.colors.text.tertiary} />
            <Text2 size="xs" weight="medium" color="tertiary">
              Converting {formatPrice(bridgeFundGasCoverAmountUsd ?? 0)} of{' '}
              {bridgeFundGasQuote.price.sell.token.symbol} to cover native{' '}
              {token.chain} fees.
            </Text2>
          </View>
        )}
        {/* Deposit amount conversion text. Only show if we can even route the deposit */}
        {(!needsBridge || bridgeFundGasQuote?.success) &&
          depositFundGasQuote?.quote.success && (
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <CircleAlertIcon size={14} color={t.colors.text.tertiary} />
              <Text2 size="xs" weight="medium" color="tertiary">
                Converting {formatPrice(depositFundGasCoverAmountUsd ?? 0)} of{' '}
                {depositFundGasQuote.quote.price.sell.token.symbol} to cover{' '}
                native {vault.chain} fees.
              </Text2>
            </View>
          )}
        {/* No crosschain route available */}
        {needsBridge &&
          bridgeQuoteError &&
          bridgeQuoteError.error !== 'NEEDS_GAS' && (
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <TriangleAlertIcon size={16} color={t.colors.text.warning} />
              <Text2 size="sm" weight="medium" color="warning">
                No route found to complete this deposit
              </Text2>
            </View>
          )}
      </View>

      {/* Fees display */}
      <AnimatedPressable
        onPress={() => setShowFeeDetails(true)}
        disabled={!estimatedFeesUsd}
        disableAnimation={!estimatedFeesUsd}
        style={[t.flexRow, t.selfEnd, t.pX3, t.pY4]}
      >
        {estimatedFeeUsdPending && amount > 0n && (
          <TextPlaceholder width={75} />
        )}
        {(!estimatedFeeUsdPending || insufficientFunds || amount === 0n) && (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.roundedFull,
              { gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
            ]}
          >
            <CoinStackIcon size={14} />
            <Text2 size="sm" weight="medium" color="informative">
              {formatPrice(estimatedFeesUsd ?? 0, {
                maximumSignificantDigits:
                  (estimatedFeesUsd ?? 0) < 0.01 ? 2 : undefined,
              })}
            </Text2>
          </View>
        )}
      </AnimatedPressable>

      {/* Fee details bottom sheet */}
      {showFeeDetails && (
        <USDCLendingFeeDetailsBottomSheetModal
          feesUsd={estimatedFeesUsd ?? 0}
          onDismiss={() => setShowFeeDetails(false)}
        />
      )}

      {/* Numpad with Quick Select */}
      <NumpadWithQuickSelect
        value={amountText}
        maxValue={maxAmountText}
        onChange={setAmountText}
      />

      {/* Hold to Deposit Button */}
      <View style={[t.pX3, t.pY6, { marginBottom: 10 }]}>
        <HoldToTransactButton
          title={
            insufficientFunds || bridgeQuoteError?.error === 'NEEDS_GAS'
              ? 'Insufficient Funds For Gas'
              : insufficientBalance
                ? 'Insufficient Balance'
                : 'Hold to Deposit'
          }
          pressingTitle="Depositing"
          usdValue={parseFloat(amountText)}
          onConfirm={onConfirm}
          error={(estimatedFeesUsd ?? 0) > 1}
          disabled={
            phase !== 'idle' ||
            amount === 0n ||
            insufficientBalance ||
            insufficientFunds ||
            (needsBridge && !!bridgeQuoteError) ||
            estimatedDepositFeeUsdPending ||
            isFetchingBridgeQuote
          }
        />
      </View>

      {/* Loading overlay */}
      {phase !== 'idle' &&
        phase !== 'deposit-complete' &&
        phase !== 'bridge-error' &&
        phase !== 'deposit-error' && (
          <LinearGradient
            colors={[t.colors.background.default, '#1B1535']}
            style={[StyleSheet.absoluteFill, t.itemsCenter, t.justifyCenter]}
          >
            <View style={[t.flexCol, t.itemsCenter, { gap: 16 }]}>
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <LoadingIndicator color={t.colors.text.brand} />
                <Text2 size="lg" weight="semibold" color="primary">
                  {phase === 'waiting' && 'Moving USDC'}
                  {phase === 'bridge-complete' && 'Depositing'}
                  {phase === 'depositing' && 'Depositing'}
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <TokenIcon
                  iconUrl={token.iconUrl}
                  diameter={40}
                  symbol={token.symbol}
                />
                <Text2 size="2xl" weight="medium" color="primary">
                  {token.symbol}
                </Text2>
              </View>
            </View>
          </LinearGradient>
        )}

      {/* Deposit failed overlay */}
      {(phase === 'deposit-error' || phase === 'bridge-error') && (
        <View style={[StyleSheet.absoluteFill, t.bgDefault, t.justifyBetween]}>
          <View style={[t.flex1, t.itemsCenter, t.pT6, { gap: 16 }]}>
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <View
                style={[
                  t.w4,
                  t.h4,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.roundedFull,
                  { backgroundColor: t.colors.text.danger },
                ]}
              >
                <X size={8} color={t.colors.text.light} strokeWidth={5} />
              </View>
              <Text2 size="lg" weight="semibold" color="primary">
                {phase === 'deposit-error' ? 'Deposit failed' : 'Bridge failed'}
              </Text2>
            </View>
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <TokenIcon
                iconUrl={token.iconUrl}
                diameter={40}
                symbol={token.symbol}
                chain={phase === 'deposit-error' ? vault.chain : token.chain}
              />
              <Text2 size="2xl" weight="medium" color="primary">
                {token.symbol}
              </Text2>
            </View>
            <Text2 size="sm" weight="medium" color="tertiary">
              Please try again shortly.
            </Text2>
          </View>
          {DoneButton}
        </View>
      )}

      {/* Success overlay */}
      {phase === 'deposit-complete' && (
        <View style={[StyleSheet.absoluteFill, t.bgDefault, t.justifyBetween]}>
          <View style={[t.flex1, t.pX3, t.pT6]}>
            <View style={[t.flexCol, t.itemsCenter, { gap: 24 }]}>
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <View
                  style={[
                    t.backgrounds.brand,
                    t.roundedFull,
                    t.justifyCenter,
                    t.itemsCenter,
                    { width: 18, height: 18 },
                  ]}
                >
                  <Check size={10} color="white" strokeWidth={4} />
                </View>
                <Text2 size="lg" weight="semibold" color="primary">
                  Deposit succeeded
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <TokenIcon
                  iconUrl={token.iconUrl}
                  diameter={40}
                  symbol={token.symbol}
                />
                <Text2 size="2xl" weight="medium" color="primary">
                  {token.symbol}
                </Text2>
              </View>
            </View>
            <View style={[t.flexCol, t.pT9, { gap: 12 }]}>
              <View style={[t.flexRow, t.justifyBetween]}>
                <Text2 size="sm" weight="medium" color="secondary">
                  Amount
                </Text2>
                <Text2 size="sm" weight="medium" color="primary">
                  {amountText} {token.symbol}
                </Text2>
              </View>
              <View style={[t.flexRow, t.justifyBetween]}>
                <Text2 size="sm" weight="medium" color="secondary">
                  Market Fees
                </Text2>
                <Text2 size="sm" weight="medium" color="primary">
                  {formatPrice(estimatedFeesUsd ?? 0, {
                    maximumSignificantDigits:
                      (estimatedFeesUsd ?? 0) < 0.01 ? 2 : undefined,
                  })}
                </Text2>
              </View>
            </View>
          </View>
          {DoneButton}
        </View>
      )}
    </View>
  );
}
