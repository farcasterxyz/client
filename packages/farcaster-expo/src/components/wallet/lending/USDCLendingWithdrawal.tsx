import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  ApiOnchainMorphoVault,
  getUsdcAddress,
} from 'farcaster-client-data';
import {
  formatPrice,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import { Check, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { parseUnits } from 'viem';

import {
  useEmbeddedWallet,
  useSharedTelemetry,
  useTheme,
  useWalletTransactions,
} from '../../../contexts';
import { useMorphoWithdrawal, useWalletRefresh } from '../../../hooks';
import { TokenIcon } from '../../crypto';
import {
  formatNumPadValue,
  NumpadWithQuickSelect,
} from '../../crypto/tokens/swap/Numpad';
import {
  AnimatedPressable,
  HoldToTransactButton,
  LoadingIndicator,
  Text2,
  TextPlaceholder,
} from '../../design-system';
import { CoinStackIcon } from '../../icons';
import { USDCLendingIcon } from '../../icons/USDCLendingIcon';
import { WalletScreenHeader } from '../WalletScreenHeader';
import { USDCLendingFeeDetailsBottomSheetModal } from './USDCLendingFeeDetailsBottomSheetModal';

const baseUsdcAddress = getUsdcAddress('base')! as `0x${string}`;

export function USDCLendingWithdrawal({
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
    trackEvent(AnalyticsEvent.ViewUSDCLendingWithdraw);
  }, [trackEvent]);

  const refreshWallet = useWalletRefresh();
  const recordWalletTransaction = useRecordWalletTransaction();

  const { evmAddress } = useEmbeddedWallet();
  const { prepareAction } = useWalletTransactions();

  const [amountText, setAmountText] = React.useState('0');
  const [showFeeDetails, setShowFeeDetails] = React.useState(false);

  const isWithdrawingRef = React.useRef<boolean>(false);
  const [isWithdrawing, _setIsWithdrawingInternal] = React.useState(false);
  const setIsWithdrawing = React.useCallback((value: boolean) => {
    isWithdrawingRef.current = value;
    _setIsWithdrawingInternal(value);
  }, []);

  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);
  const [withdrawFailed, setWithdrawFailed] = React.useState(false);

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

  const {
    data: actions,
    estimatedFeeUsd,
    insufficientFunds,
    estimatedFeeUsdPending,
  } = useMorphoWithdrawal({
    chain: vault.chain,
    ca: vault.ca,
    address: evmAddress as `0x${string}`,
    amount: amount,

    // If the max, withdraw in quantity of shares (max)
    shares: amountText === maxAmountText ? true : false,
  });

  const onConfirm = React.useCallback(() => {
    if (isWithdrawingRef.current) {
      return;
    }

    // Update ref immediately to prevent double execution
    isWithdrawingRef.current = true;

    const metadata = {
      type: 'morpho-withdraw' as const,
      vault: vault,
      chain: vault.chain,
      ca: baseUsdcAddress,
      amount: amount.toString(),
      actions: actions,
    };

    const action = prepareAction({
      protocol: 'actions',
      chain: vault.chain,
      toast: false,
      actions: actions,
      metadata: metadata,
      onExecute: () => setIsWithdrawing(true),
      onError: () => {
        trackEvent(AnalyticsEvent.USDCLendingWithdrawError);
        setIsWithdrawing(false);
        setWithdrawFailed(true);
      },
      onSuccess: async (txHash: string) => {
        trackEvent(AnalyticsEvent.USDCLendingWithdrawSuccess);
        try {
          await Promise.all([
            await recordWalletTransaction({
              params: {
                ethAddress: evmAddress as `0x${string}`,
                ethTxHash: txHash,
                ethChainId: Number(apiChainToChainIdOrThrow(vault.chain)),
                metadata: { ...metadata, status: 'succeeded' },
              },
            }),

            await refreshWallet(
              [
                {
                  chain: 'base',
                  ca: baseUsdcAddress,
                  decimals: 6,

                  // In case this user doens't have position, insert a template
                  position: {
                    id: `base:${baseUsdcAddress.toLowerCase()}`,
                    chain: 'base',
                    quantity: {
                      float: parseFloat(amountText),
                      int: amount.toString(),
                    },
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6,
                    price: 1,
                    address: baseUsdcAddress,
                    hidden: true,
                    features: { canTrade: true, isTestnet: false },
                    token: {
                      name: 'USD Coin',
                      ticker: 'USDC',
                      ca: baseUsdcAddress,
                      chain: 'base',
                      decimals: 6,
                      imageUrl: '',
                    },
                  },
                },
                { chain: vault.chain, ca: vault.ca, decimals: 18 },
              ],
              true,
            ),
          ]);
        } finally {
          setIsWithdrawing(false);
          setWithdrawSuccess(true);
        }
      },
    });

    action.submit();
  }, [
    vault,
    amount,
    amountText,
    actions,
    evmAddress,
    prepareAction,
    refreshWallet,
    recordWalletTransaction,
    setIsWithdrawing,
    trackEvent,
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
      <WalletScreenHeader title="Withdraw" onBackCallback={goBack} />
      <View style={[t.flexRow, t.itemsCenter, t.p3, { gap: 8 }]}>
        <USDCLendingIcon />
        <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
          <Text2 color="primary" weight="semibold" numberOfLines={1}>
            USD Coin Lending
          </Text2>
          <Text2 size="sm" color="success" weight="semibold">
            Earning {(vault.avgApy * 100).toFixed(2)}% APY
          </Text2>
        </View>
        <Text2 color="primary" weight="semibold" numberOfLines={1}>
          {formatPrice(token.value ?? 0)}
        </Text2>
      </View>

      {/* Amount display */}
      <View style={[t.flex1, t.justifyCenter, t.itemsCenter]}>
        <Text2 weight="semibold" color="primary" size="6xl">
          ${formatNumPadValue(amountText)}
        </Text2>
      </View>

      {/* Fees display */}
      <AnimatedPressable
        style={[t.flexRow, t.selfEnd, t.pX3, t.pY4]}
        disabled={!estimatedFeeUsd}
        disableAnimation={!estimatedFeeUsd}
        onPress={() => setShowFeeDetails(true)}
      >
        {estimatedFeeUsdPending && amount > 0n && (
          <TextPlaceholder width={75} size="sm" />
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
              {formatPrice(estimatedFeeUsd ?? 0, {
                maximumSignificantDigits: 2,
              })}
            </Text2>
          </View>
        )}
      </AnimatedPressable>

      {/* Fee details bottom sheet */}
      {showFeeDetails && (
        <USDCLendingFeeDetailsBottomSheetModal
          feesUsd={estimatedFeeUsd ?? 0}
          onDismiss={() => setShowFeeDetails(false)}
        />
      )}

      {/* Numpad with Quick Select */}
      <NumpadWithQuickSelect
        value={amountText}
        maxValue={maxAmountText}
        onChange={setAmountText}
      />

      {/* Hold to Withdraw Button */}
      <View style={[t.pX3, t.pY6, { marginBottom: 10 }]}>
        <HoldToTransactButton
          title={
            insufficientFunds
              ? 'Insufficient Funds For Gas'
              : insufficientBalance
                ? 'Insufficient Balance'
                : 'Hold to Withdraw'
          }
          pressingTitle="Withdrawing"
          usdValue={parseFloat(amountText)}
          onConfirm={onConfirm}
          disabled={
            amount === 0n ||
            insufficientBalance ||
            insufficientFunds ||
            estimatedFeeUsdPending
          }
        />
      </View>

      {/* Loading overlay */}
      {isWithdrawing && (
        <LinearGradient
          colors={[t.colors.background.default, '#1B1535']}
          style={[StyleSheet.absoluteFill, t.itemsCenter, t.justifyCenter]}
        >
          <View style={[t.flexCol, t.itemsCenter, { gap: 16 }]}>
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <LoadingIndicator color={t.colors.text.brand} />
              <Text2 size="lg" weight="semibold" color="primary">
                Withdrawing
              </Text2>
            </View>
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <TokenIcon diameter={40} symbol="USDC" />
              <Text2 size="2xl" weight="medium" color="primary">
                USDC
              </Text2>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Failed overlay */}
      {!isWithdrawing && withdrawFailed && (
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
                Withdrawal failed
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
      {!isWithdrawing && withdrawSuccess && (
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
                  Withdrawal succeeded
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <TokenIcon diameter={40} symbol="USDC" chain={vault.chain} />
                <Text2 size="2xl" weight="medium" color="primary">
                  USDC
                </Text2>
              </View>
            </View>
            <View style={[t.flexCol, t.pT9, { gap: 12 }]}>
              <View style={[t.flexRow, t.justifyBetween]}>
                <Text2 size="sm" weight="medium" color="secondary">
                  Amount
                </Text2>
                <Text2 size="sm" weight="medium" color="primary">
                  {amountText} USDC
                </Text2>
              </View>
              <View style={[t.flexRow, t.justifyBetween]}>
                <Text2 size="sm" weight="medium" color="secondary">
                  Market Fees
                </Text2>
                <Text2 size="sm" weight="medium" color="primary">
                  {formatPrice(estimatedFeeUsd ?? 0, {
                    maximumSignificantDigits: 2,
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
