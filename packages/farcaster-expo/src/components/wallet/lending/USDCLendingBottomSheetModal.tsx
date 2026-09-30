import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
  isUsdc,
} from 'farcaster-client-data';
import {
  formatPrice,
  useOnchainMorphoFarcasterVault,
} from 'farcaster-client-hooks';
import { ArrowRightIcon, CoinsIcon, WalletIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useWalletBalances } from '../../../hooks';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { TokenIcon } from '../../crypto';
import {
  AnimatedBalanceDisplay,
  AnimatedPressable,
  Text2,
  TextPlaceholder,
  TextWithPress,
} from '../../design-system';
import { USDCLendingIcon } from '../../icons/USDCLendingIcon';
import { USDCLendingDeposit } from './USDCLendingDeposit';
import { USDCLendingWithdrawal } from './USDCLendingWithdrawal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export function USDCLendingBottomSheetModal({
  usdcToken,
  onLearnMore,
  onDismiss,
}: {
  usdcToken?: ApiTokenLink;
  onLearnMore: () => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { push } = useSharedNavigationContext();
  const { trackEvent } = useSharedTelemetry();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewUSDCLending);
  }, [trackEvent]);

  const [showWithdrawalView, setShowWithdrawalView] =
    React.useState<ApiEthFungibleTokenPosition | null>(null);

  const [showDepositView, setShowDepositView] =
    React.useState<ApiEthFungibleTokenPosition | null>(null);

  const { data: vault } = useOnchainMorphoFarcasterVault();
  const { balances } = useWalletBalances();

  const usdcBalances = React.useMemo(() => {
    return balances.filter((b) => !!b.token?.ca && isUsdc(b.token?.ca));
  }, [balances]);

  const totalUsdcBalancesUsd = React.useMemo(() => {
    return usdcBalances.reduce((acc, b) => acc + (b.value ?? 0), 0);
  }, [usdcBalances]);

  const vaultBalance = React.useMemo(() => {
    if (!vault) return null;

    const balance = balances.find(
      (b) => b.token?.ca.toLowerCase() === vault?.token.ca.toLowerCase(),
    );

    if (!balance) return null;

    // Update the value/price with the share price (FIX: temporarily fallback to 1 if 0)
    const sharePrice = vault.vault.sharePrice || 1;

    balance.value = balance.quantity.float * sharePrice;
    balance.price = sharePrice;
    return balance;
  }, [balances, vault]);

  const vaultEarningsUsd = React.useMemo(() => {
    if (!vault) {
      return null;
    } else if (!vaultBalance) {
      return 0;
    }

    // Update the value/price with the share price (FIX: temporarily fallback to 1 if 0)
    const sharePrice = vault.vault.sharePrice || 1;
    return vaultBalance.quantity.float * sharePrice;
  }, [vaultBalance, vault]);

  // 0 = main view, 1 = secondary view
  const progress = useSharedValue(0);
  const swipeOffset = useSharedValue(0);

  const navigateToWithdrawalView = useCallback(() => {
    if (!vault) return;

    setShowWithdrawalView(vaultBalance);
    progress.value = withTiming(1, { duration: 300 });
  }, [progress, vault, vaultBalance]);

  const navigateToDepositView = useCallback(
    (token: ApiEthFungibleTokenPosition) => {
      setShowDepositView(token);
      progress.value = withTiming(1, { duration: 300 });
    },
    [progress],
  );

  const navigateToMainView = useCallback(() => {
    'worklet';
    swipeOffset.value = withTiming(0, { duration: 250 });
    progress.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setShowDepositView)(null);
        runOnJS(setShowWithdrawalView)(null);
      }
    });
  }, [progress, swipeOffset]);

  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(true)
        .activeOffsetX(10)
        .failOffsetY([-15, 15])
        .onUpdate((e) => {
          'worklet';
          if (e.translationX > 0) {
            swipeOffset.value = e.translationX;
          }
        })
        .onEnd((e) => {
          'worklet';
          if (
            e.translationX > SWIPE_THRESHOLD ||
            e.velocityX > VELOCITY_THRESHOLD
          ) {
            navigateToMainView();
          } else {
            swipeOffset.value = withSpring(0, { damping: 20 });
          }
        }),
    [swipeOffset, navigateToMainView],
  );

  // List view slides slightly left when token is shown
  const mainAnimatedStyle = useAnimatedStyle(() => {
    const baseTranslate = interpolate(
      progress.value,
      [0, 1],
      [0, -SCREEN_WIDTH * 0.3],
    );
    const swipeAdjust = interpolate(
      swipeOffset.value,
      [0, SCREEN_WIDTH],
      [0, SCREEN_WIDTH * 0.3],
    );
    return {
      transform: [{ translateX: baseTranslate + swipeAdjust }],
      opacity: interpolate(progress.value, [0, 1], [1, 0.5]),
    };
  });

  const secondaryAnimatedStyle = useAnimatedStyle(() => {
    const baseTranslate = interpolate(
      progress.value,
      [0, 1],
      [SCREEN_WIDTH, 0],
    );
    return {
      transform: [{ translateX: baseTranslate + swipeOffset.value }],
    };
  });

  const renderUsdc = useCallback(
    (token: ApiEthFungibleTokenPosition) => {
      if (token.quantity.float < 0.01) {
        return null;
      }

      return (
        <AnimatedPressable
          key={`${token.chain}:${token.address}`}
          disabled={!vault}
          disableAnimation={!vault}
          onPress={() => navigateToDepositView(token)}
          style={[t.flexRow, t.p3, { gap: 8 }]}
        >
          <TokenIcon
            iconUrl={token.iconUrl}
            diameter={40}
            symbol={token.symbol}
            chain={token.chain}
          />
          <View style={[t.flex1, t.flexRow, t.justifyBetween]}>
            <View style={[t.flexCol]}>
              <Text2 weight="semibold" color="primary">
                {token.symbol}
              </Text2>
              <Text2 size="sm" weight="semibold" color="tertiary">
                {token.quantity.float.toFixed(2)} {token.symbol}
              </Text2>
            </View>
            {!vault && <TextPlaceholder width={40} size="lg" />}
            {vault && (
              <View
                style={[
                  t.backgrounds.secondary,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.p3,
                  t.roundedFull,
                  { width: 40, height: 40 },
                ]}
              >
                <ArrowRightIcon size={20} color={t.colors.text.primary} />
              </View>
            )}
          </View>
        </AnimatedPressable>
      );
    },
    [t, vault, navigateToDepositView],
  );

  const GettingStartedComponent = useMemo(() => {
    return (
      <View>
        <AnimatedPressable
          onPress={() => push({ path: 'WalletReceive' })}
          style={[t.flexRow, t.p3, { gap: 8 }]}
        >
          <View
            style={[
              t.w10,
              t.h10,
              t.justifyCenter,
              t.itemsCenter,
              t.backgrounds.tertiary,
              { borderRadius: 10 },
            ]}
          >
            <WalletIcon size={24} color={t.colors.text.primary} />
          </View>
          <View style={[t.flex1, t.flexRow, t.justifyBetween]}>
            <View style={[t.flexCol, { gap: 2 }]}>
              <Text2 weight="semibold" color="primary">
                Deposit USDC
              </Text2>
              <Text2 size="sm" weight="semibold" color="tertiary">
                Deposit USDC and start trading
              </Text2>
            </View>
            <View
              style={[
                t.backgrounds.secondary,
                t.itemsCenter,
                t.justifyCenter,
                t.p3,
                t.roundedFull,
                { width: 40, height: 40 },
              ]}
            >
              <ArrowRightIcon size={20} color={t.colors.text.primary} />
            </View>
          </View>
        </AnimatedPressable>
        <AnimatedPressable
          disabled={!usdcToken}
          disableAnimation={!usdcToken}
          onPress={() =>
            push({
              path: 'WalletSwap',
              params: {
                platformType: 'mobile',
                swapIntent: {
                  buy: {
                    address: usdcToken?.ca ?? '',
                    chainId: Number(
                      apiChainToChainIdOrThrow(usdcToken?.chain ?? 'base'),
                    ),
                  },
                },
              },
            })
          }
          style={[t.flexRow, t.p3, { gap: 8 }]}
        >
          <View
            style={[
              t.w10,
              t.h10,
              t.justifyCenter,
              t.itemsCenter,
              t.backgrounds.tertiary,
              { borderRadius: 10 },
            ]}
          >
            <CoinsIcon size={30} color={t.colors.text.primary} />
          </View>
          <View style={[t.flex1, t.flexRow, t.justifyBetween]}>
            <View style={[t.flexCol, { gap: 2 }]}>
              <Text2 weight="semibold" color="primary">
                Swap into USDC
              </Text2>
              <Text2 size="sm" weight="semibold" color="tertiary">
                Convert your tokens to start lending
              </Text2>
            </View>
            <View
              style={[
                t.backgrounds.secondary,
                t.itemsCenter,
                t.justifyCenter,
                t.p3,
                t.roundedFull,
                { width: 40, height: 40 },
              ]}
            >
              <ArrowRightIcon size={20} color={t.colors.text.primary} />
            </View>
          </View>
        </AnimatedPressable>
      </View>
    );
  }, [t, usdcToken, push]);

  const isGettingStarted = React.useMemo(() => {
    return totalUsdcBalancesUsd < 1;
  }, [totalUsdcBalancesUsd]);

  return (
    <AutoDisplayingBottomSheetModal
      name="wallet-cash-bottom-sheet"
      handleIndicatorStyle={{ backgroundColor: t.colors.text.tertiary }}
      onDismiss={onDismiss}
      snapPoints={['100%']}
      enableDynamicSizing={false}
      disableBottomSheetContentContainer
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      {/* Stacked views container */}
      <View
        style={[t.flex1, { overflow: 'hidden', paddingBottom: insets.bottom }]}
      >
        {/* List view - always mounted */}
        <Animated.View
          style={[StyleSheet.absoluteFill, mainAnimatedStyle, t.justifyBetween]}
        >
          <View>
            <View style={[t.flexRow, t.p3, t.itemsCenter, { gap: 8 }]}>
              <USDCLendingIcon />
              <View style={[t.flexCol, { gap: 2 }]}>
                <Text2 size="lg" weight="semibold">
                  USDC Lending
                </Text2>
                {!vault && <TextPlaceholder width={80} size="sm" />}
                {vault && (
                  <Text2 size="sm" color="success" weight="semibold">
                    Earning {(vault.vault.avgApy * 100).toFixed(2)}% APY
                  </Text2>
                )}
              </View>
            </View>
            <View style={[t.p3, { gap: 8 }]}>
              <Text2 weight="semibold" color="primary">
                Earning Balance
              </Text2>
              {vaultEarningsUsd === null && (
                <TextPlaceholder width={80} size="5xl" />
              )}
              {vaultEarningsUsd !== null && (
                <AnimatedBalanceDisplay
                  size="5xl"
                  maximumFractionDigits={2}
                  amount={vaultEarningsUsd}
                />
              )}
            </View>
            <View style={[t.p3, t.flexRow, t.justifyBetween]}>
              <Text2 weight="semibold" color="primary">
                {isGettingStarted ? 'Get Started' : 'Available to earn'}
              </Text2>
              {!isGettingStarted && (
                <Text2 weight="semibold" color="secondary">
                  {formatPrice(totalUsdcBalancesUsd)}
                </Text2>
              )}
            </View>

            {!isGettingStarted && (
              <View>{usdcBalances.map((balance) => renderUsdc(balance))}</View>
            )}

            {isGettingStarted && GettingStartedComponent}
          </View>

          <View style={[t.flexCol, t.p3, t.mB6, { gap: 12 }]}>
            <View style={[t.flexRow, t.justifyCenter]}>
              <Text2 size="sm" color="secondary">
                USDC Lending powered by Morpho.
                <TextWithPress onPress={onLearnMore} style={[t.texts.brand]}>
                  <Text2 size="sm" color="brand">
                    {' '}
                    Learn more
                  </Text2>
                </TextWithPress>
              </Text2>
            </View>
            {(vaultEarningsUsd ?? 0) > 0.01 && (
              <AnimatedPressable
                onPress={navigateToWithdrawalView}
                style={[
                  t.p3,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.roundedFull,
                  t.backgrounds.brand,
                ]}
              >
                <Text2 size="lg" weight="semibold" color="light">
                  Withdraw
                </Text2>
              </AnimatedPressable>
            )}
          </View>
        </Animated.View>

        {/* Deposit view */}
        {showDepositView && !showWithdrawalView && vault && (
          <GestureDetector gesture={swipeBackGesture}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                secondaryAnimatedStyle,
                t.bgDefault,
              ]}
            >
              <USDCLendingDeposit
                token={showDepositView}
                vault={vault.vault}
                goBack={navigateToMainView}
              />
            </Animated.View>
          </GestureDetector>
        )}

        {/* Withdrawal view */}
        {showWithdrawalView && !showDepositView && vault && (
          <GestureDetector gesture={swipeBackGesture}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                secondaryAnimatedStyle,
                t.bgDefault,
              ]}
            >
              <USDCLendingWithdrawal
                token={showWithdrawalView}
                vault={vault.vault}
                goBack={navigateToMainView}
              />
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
