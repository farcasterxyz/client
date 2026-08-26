import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
  buildCaip19TokenUri,
  formatDecimal,
  isNativeAsset,
  isUsdc,
} from 'farcaster-client-data';
import {
  formatShorthandAmount,
  useInvalidateTokenFeed,
} from 'farcaster-client-hooks';
import { BellPlus, Check, Loader, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { isDev } from '../../../../constants/Env';
import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useSharedUserAppContext,
  useTheme,
} from '../../../../contexts';
import {
  useCurrentUser,
  useOptionalSafeAreaInsets,
  useUserLevel,
  useWalletShowTokenCastsCta,
} from '../../../../hooks';
import {
  buildCaipTxUri,
  formatFee,
  formatTokenDecimals,
  parseTokenAmount,
  tokenLinkToMinimalToken,
} from '../../../../utils';
import { AnimatedPressable, Text2 } from '../../../design-system';
import { AddAlertBottomSheet } from '../../../wallet';
import { TokenIcon } from '../TokenIcon';
import { useSwapTokens } from './SwapTokensProvider';
import { useSwapFees } from './useSwapFees';

export function SwapTokensResult() {
  const t = useTheme();
  const { state, buyToken, sellToken } = useSwapTokens();

  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (state.state === 'processing') {
      progress.value = 0;
    } else if (state.state === 'confirmed' || state.state === 'reverted') {
      progress.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state, progress]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: t.colors.background.default,
      opacity: progress.value,
    };
  });

  const { token, mode } = React.useMemo(() => {
    const isSellNative = isNativeAsset(sellToken?.ca);
    const isBuyNative = isNativeAsset(buyToken?.ca);
    const isSellUsdc = isUsdc(sellToken?.ca);
    const isBuyUsdc = isUsdc(buyToken?.ca);

    if (isSellUsdc) {
      return {
        mode: 'buy' as const,
        token: buyToken,
      };
    } else if (isBuyUsdc) {
      return {
        mode: 'sell' as const,
        token: sellToken,
      };
    } else if (isSellNative) {
      return {
        mode: 'buy' as const,
        token: buyToken,
      };
    } else if (isBuyNative) {
      return {
        mode: 'sell' as const,
        token: sellToken,
      };
    } else {
      return {
        mode: 'buy' as const,
        token: buyToken,
      };
    }
  }, [buyToken, sellToken]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[t.flex1]}
    >
      <ScrollView contentContainerStyle={[t.flex1]}>
        <Animated.View entering={FadeIn} style={[t.flex1, t.justifyEnd]}>
          <LinearGradient
            colors={[t.colors.background.default, t.colors.violet300]}
            locations={[0, 1]}
            style={[t.absolute, t.top0, t.left0, t.right0, t.bottom0, t.flex1]}
          />
          <Animated.View
            style={[
              t.absolute,
              t.top0,
              t.left0,
              t.right0,
              t.bottom0,
              backgroundAnimatedStyle,
            ]}
          />
          {token && (
            <Status
              progress={progress}
              token={tokenLinkToMinimalToken(token)}
              mode={mode}
            />
          )}
          {token && (
            <Actions
              progress={progress}
              token={tokenLinkToMinimalToken(token)}
              mode={mode}
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Actions({
  progress,
  token,
  mode,
}: {
  progress: SharedValue<number>;
  token: ApiOnchainTokenMinimal;
  mode: 'buy' | 'sell';
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const invalidateTokenFeed = useInvalidateTokenFeed();
  const { replace, goBack, push, popToTop } = useSharedNavigationContext();
  const { sellToken, buyToken, sellAmount, preparedQuote, state, tryAgain } =
    useSwapTokens();
  const [dismissed, setDismissed] = useWalletShowTokenCastsCta();
  const { trackEvent } = useSharedTelemetry();

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  const onCastPress = React.useCallback(async () => {
    if (
      state.state !== 'confirmed' ||
      !preparedQuote ||
      !sellToken ||
      !buyToken
    ) {
      return;
    }

    const optimisticTxEmbed: ApiOnchainTransactionSwapEmbed = {
      address: token.ca,
      sellToken: tokenLinkToMinimalToken(sellToken),
      buyToken: tokenLinkToMinimalToken(buyToken),
      sellAmount: sellAmount,
      buyAmount: preparedQuote.quote.buyAmount,
      chain: token.chain,
      txHash: state.txHash,
      type: 'swap',
    };

    popToTop();

    replace({
      path: 'CreateCast',
      params: {
        intent: {
          text: '',
          embeds: [buildCaipTxUri(token.chain, state.txHash)],
          tokenKey: buildCaip19TokenUri(token.chain, token.ca),
          mentions: [],
        },
        onSuccess: () => {
          trackEvent(AnalyticsEvent.CreateTokenCast, {
            chain: token.chain,
            contractAddress: token.ca,
          });
          invalidateTokenFeed({
            chain: token.chain,
            ca: token.ca,
            feedType: 'all',
          });
          invalidateTokenFeed({
            chain: token.chain,
            ca: token.ca,
            feedType: 'recommended',
          });
          if (!dismissed) {
            setDismissed(true);
          }
        },
        onDismiss: () => {
          push({ path: 'WalletSwap', params: { platformType: 'mobile' } });
        },
        banner: {
          type: 'swap',
          sellToken: tokenLinkToMinimalToken(sellToken),
          buyToken: tokenLinkToMinimalToken(buyToken),
          sellAmount: parseFloat(sellAmount),
          buyAmount: parseTokenAmount(
            preparedQuote.quote.buyAmount,
            formatTokenDecimals(buyToken.chain, buyToken.decimals),
          ),
          mode: mode,
        },
        optimisticTxEmbed,
      },
    });
  }, [
    token,
    state,
    invalidateTokenFeed,
    replace,
    preparedQuote,
    sellToken,
    buyToken,
    sellAmount,
    mode,
    push,
    dismissed,
    setDismissed,
    trackEvent,
    popToTop,
  ]);

  if (state.state === 'processing') {
    return null;
  }

  if (state.state === 'reverted') {
    return (
      <Animated.View
        style={[t.pX3, { gap: 12, paddingBottom: insets.bottom }, opacityStyle]}
      >
        <AnimatedPressable style={{ height: 48 }} onPress={tryAgain}>
          <View
            style={[
              t.flex1,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Try again
            </Text2>
          </View>
        </AnimatedPressable>
        <AnimatedPressable style={{ height: 48 }} onPress={goBack}>
          <View
            style={[
              t.flex1,
              t.backgrounds.default,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="secondary">
              Cancel
            </Text2>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[t.pX3, { gap: 12, paddingBottom: insets.bottom }, opacityStyle]}
    >
      {/* <View style={[t.flexRow, t.itemsCenter, t.justifyCenter, { gap: 8 }]}>
        <DollarSign />
        <Text2 size="sm" color="secondary">
          Top comments share a prize pool of $5,000 daily
        </Text2>
      </View> */}
      <View>
        {Platform.OS !== 'web' && (
          <AnimatedPressable style={[{ height: 48 }]} onPress={onCastPress}>
            <View
              style={[
                t.flex1,
                t.flexRow,
                t.backgrounds.brand,
                { borderRadius: 32 },
                t.justifyCenter,
                t.itemsCenter,
                { height: 48, gap: 8 },
              ]}
            >
              <Text2 size="lg" weight="semibold" color="light">
                Cast this trade
              </Text2>
            </View>
          </AnimatedPressable>
        )}
        <AnimatedPressable style={{ height: 48 }} onPress={goBack}>
          <View
            style={[
              t.flex1,
              t.backgrounds.default,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="secondary">
              {Platform.OS === 'web' ? 'Close' : 'Skip'}
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

export function DollarSign() {
  const t = useTheme();
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Path
        d="M2.8874 6.46507C2.77793 5.97197 2.79474 5.45921 2.93627 4.97433C3.0778 4.48945 3.33946 4.04816 3.697 3.69136C4.05454 3.33457 4.49638 3.07383 4.98156 2.93332C5.46673 2.79281 5.97953 2.77707 6.4724 2.88757C6.74368 2.4633 7.1174 2.11414 7.55911 1.87229C8.00082 1.63043 8.49631 1.50366 8.9999 1.50366C9.50349 1.50366 9.99898 1.63043 10.4407 1.87229C10.8824 2.11414 11.2561 2.4633 11.5274 2.88757C12.021 2.77659 12.5347 2.79225 13.0206 2.93311C13.5066 3.07396 13.949 3.33543 14.3068 3.69319C14.6645 4.05095 14.926 4.49338 15.0669 4.97932C15.2077 5.46527 15.2234 5.97895 15.1124 6.47257C15.5367 6.74385 15.8858 7.11758 16.1277 7.55929C16.3695 8.001 16.4963 8.49648 16.4963 9.00007C16.4963 9.50366 16.3695 9.99915 16.1277 10.4409C15.8858 10.8826 15.5367 11.2563 15.1124 11.5276C15.2229 12.0204 15.2072 12.5332 15.0667 13.0184C14.9261 13.5036 14.6654 13.9454 14.3086 14.303C13.9518 14.6605 13.5105 14.9222 13.0256 15.0637C12.5408 15.2052 12.028 15.222 11.5349 15.1126C11.264 15.5385 10.89 15.8891 10.4475 16.1321C10.005 16.375 9.50842 16.5024 9.00365 16.5024C8.49888 16.5024 8.00227 16.375 7.55981 16.1321C7.11734 15.8891 6.74333 15.5385 6.4724 15.1126C5.97953 15.2231 5.46673 15.2073 4.98156 15.0668C4.49638 14.9263 4.05454 14.6656 3.697 14.3088C3.33946 13.952 3.0778 13.5107 2.93627 13.0258C2.79474 12.5409 2.77793 12.0282 2.8874 11.5351C2.45987 11.2645 2.10771 10.8902 1.86369 10.447C1.61966 10.0038 1.4917 9.50603 1.4917 9.00007C1.4917 8.49412 1.61966 7.99638 1.86369 7.55316C2.10771 7.10994 2.45987 6.73564 2.8874 6.46507Z"
        fill={t.colors.text.brand}
        stroke={t.colors.text.brand}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M12 6H7.5C7.10218 6 6.72064 6.15804 6.43934 6.43934C6.15804 6.72064 6 7.10218 6 7.5C6 7.89782 6.15804 8.27936 6.43934 8.56066C6.72064 8.84196 7.10218 9 7.5 9H10.5C10.8978 9 11.2794 9.15804 11.5607 9.43934C11.842 9.72064 12 10.1022 12 10.5C12 10.8978 11.842 11.2794 11.5607 11.5607C11.2794 11.842 10.8978 12 10.5 12H6"
        stroke="white"
        stroke-width="1.125"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M9 13.5V4.5"
        stroke="white"
        stroke-width="1.125"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  );
}

function Status({
  progress,
  token,
  mode,
}: {
  progress: SharedValue<number>;
  token: ApiOnchainTokenMinimal;
  mode: 'buy' | 'sell';
}) {
  const t = useTheme();

  const { height: screenHeight } = Dimensions.get('window');

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const centerY = screenHeight / 2 - 100;
    const translateY = interpolate(progress.value, [0, 1], [centerY, 0]);
    return {
      position: 'absolute',
      top: translateY,
      left: 0,
      right: 0,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: progress.value * 36,
      paddingTop: 12 + progress.value * 12,
    };
  });

  return (
    <Animated.View
      style={[
        t.itemsCenter,
        {
          paddingHorizontal: 12,
          paddingVertical: 24,
        },
        containerAnimatedStyle,
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <StatusIcon />
        <StatusLabel mode={mode} />
      </View>
      <Animated.View
        style={[t.flexRow, t.itemsCenter, { gap: 8 }, t.pX8, animatedStyle]}
      >
        <TokenIcon iconUrl={token.imageUrl} diameter={36} />
        <Text2 size="3xl" weight="medium" numberOfLines={1}>
          {token.name}
        </Text2>
      </Animated.View>
      <TransactionDetails progress={progress} mode={mode} />
      {mode === 'buy' && <AlertButton token={token} progress={progress} />}
    </Animated.View>
  );
}

function StatusIcon() {
  const t = useTheme();
  const { state } = useSwapTokens();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (state.state === 'processing') {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }

    return () => {
      rotation.value = 0;
    };
  }, [rotation, state]);

  const rotationAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return state.state === 'processing' ? (
    <Animated.View style={rotationAnimatedStyle}>
      <Loader size={20} color={t.colors.text.brand} />
    </Animated.View>
  ) : state.state === 'confirmed' ? (
    <View
      style={[
        t.justifyCenter,
        t.itemsCenter,
        t.backgrounds.brand,
        t.roundedFull,
        { width: 16, height: 16 },
      ]}
    >
      <Check size={8} color={t.colors.text.light} strokeWidth={5} />
    </View>
  ) : (
    <View
      style={[
        t.justifyCenter,
        t.itemsCenter,
        t.roundedFull,
        { width: 16, height: 16, backgroundColor: t.colors.text.danger },
      ]}
    >
      <X size={8} color={t.colors.text.light} strokeWidth={5} />
    </View>
  );
}

function StatusLabel({ mode }: { mode: 'buy' | 'sell' }) {
  const { state } = useSwapTokens();

  const label = React.useMemo(() => {
    switch (state.state) {
      case 'processing':
        return mode === 'buy' ? 'Buying' : 'Selling';
      case 'confirmed':
        return mode === 'buy' ? 'Buy succeeded' : 'Sell succeeded';
      case 'reverted':
        return mode === 'buy' ? 'Buy failed' : 'Sell failed';
    }
  }, [state, mode]);

  return (
    <Text2 size="lg" weight="semibold">
      {label}
    </Text2>
  );
}

function TransactionDetails({
  progress,
  mode,
}: {
  progress: SharedValue<number>;
  mode: 'buy' | 'sell';
}) {
  const t = useTheme();

  const {
    state,
    sellAmount,
    buyToken,
    sellToken,
    preparedQuote,
    usdcDenominatedSwaps,
  } = useSwapTokens();

  const user = useCurrentUser();

  const isPro = useUserLevel(user) === 'pro' || isDev;

  const { userAppContext } = useSharedUserAppContext();
  const isNoFeeAllowlisted = userAppContext.noFeeAllowlisted;

  const fees = useSwapFees({
    fees: preparedQuote?.quote?.fees,
    isPro,
    isNoFeeAllowlisted,
    priceImpact: 0,
  });

  const rows = React.useMemo(() => {
    if (!preparedQuote?.quote) {
      return [];
    }

    const buyAmount = preparedQuote.quote.buyAmount;
    const buyQuantity = parseTokenAmount(
      buyAmount,
      formatTokenDecimals(buyToken?.chain ?? 'base', buyToken?.decimals ?? 18),
    );

    const sellQuantity = parseFloat(sellAmount);
    const sellTokenAmount = usdcDenominatedSwaps
      ? parseFloat(sellAmount) / parseFloat(sellToken?.priceUsd ?? '0')
      : sellQuantity;

    // TODO: Do we need these updated?
    const marketFee = isPro ? fees.pro.marketFee : fees.farcaster.marketFee;
    const walletFee = isPro ? fees.pro.walletFee : fees.farcaster.referralFee;

    if (state.state === 'confirmed') {
      return [
        {
          label: mode === 'sell' ? 'Sold' : 'Bought',
          value:
            mode === 'sell'
              ? `${usdcDenominatedSwaps ? formatShorthandAmount(sellTokenAmount) : formatShorthandAmount(sellTokenAmount)} ${sellToken?.ticker}`
              : `${formatShorthandAmount(buyQuantity)} ${buyToken?.ticker}`,
        },
        {
          label: mode === 'sell' ? 'Received' : 'Spent',
          value:
            mode === 'sell'
              ? `${usdcDenominatedSwaps ? formatDecimal(sellQuantity) : formatShorthandAmount(buyQuantity) + ' ' + buyToken?.ticker}`
              : usdcDenominatedSwaps
                ? `${formatDecimal(sellQuantity)}`
                : `${formatShorthandAmount(sellQuantity)} ${sellToken?.ticker}`,
        },
        { label: 'Market fees', value: formatFee(marketFee) },
        { label: 'Wallet fees', value: formatFee(walletFee) },
      ];
    } else if (state.state === 'reverted') {
      return [
        {
          label: 'Quantity',
          value: `${formatShorthandAmount(buyQuantity)} ${buyToken?.ticker}`,
        },
        {
          label: 'Spend',
          value: `${formatShorthandAmount(sellQuantity)} ${sellToken?.ticker}`,
        },
        { label: 'Market fees', value: formatFee(marketFee) },
        { label: 'Wallet fees', value: formatFee(walletFee) },
      ];
    } else {
      return [];
    }
  }, [
    preparedQuote?.quote,
    buyToken?.chain,
    buyToken?.decimals,
    buyToken?.ticker,
    sellAmount,
    usdcDenominatedSwaps,
    sellToken?.priceUsd,
    sellToken?.ticker,
    isPro,
    fees.pro.marketFee,
    fees.pro.walletFee,
    fees.farcaster.marketFee,
    fees.farcaster.referralFee,
    state.state,
    mode,
  ]);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  if (state.state === 'processing') {
    return null;
  }

  return (
    <Animated.View style={[t.wFull, t.pX3, { gap: 12 }, opacityStyle]}>
      {rows.map((row, index) => (
        <View
          key={index}
          style={[t.flexRow, t.justifyBetween, t.itemsCenter, { gap: 12 }]}
        >
          <Text2 size="sm" weight="medium" color="secondary">
            {row.label}
          </Text2>
          <Text2 size="sm" weight="medium" color="secondary">
            {row.value}
          </Text2>
        </View>
      ))}
    </Animated.View>
  );
}

function AlertButton({
  token,
  progress,
}: {
  token: ApiOnchainTokenMinimal;
  progress: SharedValue<number>;
}) {
  const t = useTheme();
  const { state } = useSwapTokens();
  const [addSubscriptionBottomSheet, setAddSubscriptionBottomSheet] =
    React.useState<ApiOnchainTokenMinimal | null>(null);
  const [addedAlert, setAddedAlert] = React.useState<boolean>(false);

  const handleAddAlert = React.useCallback(() => {
    if (token) {
      setAddSubscriptionBottomSheet(token);
    }
  }, [token]);

  const handleAddedAlert = React.useCallback(() => {
    setAddedAlert(true);
    setAddSubscriptionBottomSheet(null);
  }, []);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  if (state.state !== 'confirmed') {
    return null;
  }

  return (
    <>
      <AnimatedPressable
        onPress={handleAddAlert}
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          addedAlert ? t.backgrounds.default : t.backgrounds.secondary,
          addedAlert ? t.border0 : t.border,
          t.borders.secondary,
          t.p2,
          t.mT4,
          { borderRadius: t.borderRadiuses.$12, gap: 8 },
          opacityStyle,
        ]}
        disabled={addedAlert}
      >
        {addedAlert ? (
          <Check size={16} color={t.colors.text.success} />
        ) : (
          <BellPlus size={16} color={t.colors.text.secondary} />
        )}
        <Text2 size="sm" weight="medium" color="secondary">
          {addedAlert ? 'Alert set' : 'Alert on 10% price change'}
        </Text2>
      </AnimatedPressable>
      {addSubscriptionBottomSheet && (
        <AddAlertBottomSheet
          onDismiss={() => setAddSubscriptionBottomSheet(null)}
          token={addSubscriptionBottomSheet}
          displayedInModalPresentationScreen={true}
          onAddAlert={handleAddedAlert}
          via="swap"
        />
      )}
    </>
  );
}
