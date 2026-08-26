import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  buildCaip19TokenUri,
  formatDecimal,
  formatDisplayDollars,
} from 'farcaster-client-data';
import { formatPrice, formatTokenSymbol } from 'farcaster-client-hooks';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Hourglass,
} from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView as RNScrollView,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { formatUnits } from 'viem';

import {
  CreateCastParams,
  useSharedTelemetry,
  useTheme,
} from '../../../../contexts';
import {
  useLimitOrdersEnabled,
  useOptionalSafeAreaInsets,
  useSafeFocusEffect,
} from '../../../../hooks';
import { toAnalyticsName, tokenLinkToMinimalToken } from '../../../../utils';
import {
  formatLimitOrderTargetPriceDisplay,
  sellUsdAmountExceedsBalance,
  usdAmountExceedsBalance,
} from '../../../../utils/LimitOrderUsdUtils';
import { LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE } from '../../../../utils/LimitOrderUtils';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet';
import { AnimatedPressable, ButtonV2, Text2 } from '../../../design-system';
import { SwapNumPad } from '../swap';
import { TokenIcon } from '../TokenIcon';
import { TokenListItem } from '../TokenListItem';
import {
  useWalletLimitOrder,
  WalletLimitOrderExpiry,
} from './WalletLimitOrderProvider';

const expiryLabels: Record<WalletLimitOrderExpiry, string> = {
  '1d': '1 day',
  '7d': '7 days',
  '30d': '30 days',
  none: 'No expiration',
};

const orderStatusLabels = {
  open: 'Open',
  submitted: 'Open',
  filled: 'Filled',
  cancel_pending: 'Cancelling',
  cancelled: 'Cancelled',
  expired: 'Expired',
  failed: 'Failed',
} as const;

const formatOrderTokenAmount = (amount: string, decimals?: number) => {
  try {
    const formatted = formatUnits(BigInt(amount), decimals ?? 18);
    const parsed = Number(formatted);

    if (!Number.isFinite(parsed)) {
      return formatted;
    }

    return parsed.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  } catch {
    return '0';
  }
};

const normalizeInput = (value: string) => {
  if (!value || value === '.') return '0';
  return value;
};

const formatLargeInput = (value: string, maxDecimals: number) => {
  const normalized = normalizeInput(value);
  if (normalized.endsWith('.')) return normalized;

  const parts = normalized.split('.');
  const integerPart = parts[0];
  const decimalPart =
    parts[1] !== undefined ? parts[1].slice(0, maxDecimals) : undefined;

  const parsedInt = Number(integerPart);
  if (!Number.isFinite(parsedInt)) return '0';

  const formattedInt = parsedInt.toLocaleString(undefined, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  if (decimalPart !== undefined) {
    return decimalPart ? `${formattedInt}.${decimalPart}` : `${formattedInt}.`;
  }

  return formattedInt;
};

const formatTargetPriceInput = (
  value: string,
  inputMaxDecimals: number,
  priceUsd: string | number | undefined,
  currentPriceUsd: number | undefined,
  isEditing: boolean,
) =>
  formatLimitOrderTargetPriceDisplay(
    formatLargeInput(value, inputMaxDecimals),
    priceUsd,
    currentPriceUsd,
    { isEditing },
  );

const TARGET_PRICE_DISPLAY_BASE_FONT_SIZE = 56;
const TARGET_PRICE_DISPLAY_BASE_LINE_HEIGHT = 64;
const TARGET_PRICE_DISPLAY_DECIMAL_THRESHOLD = 6;
const TARGET_PRICE_DISPLAY_FONT_STEP = 5;
const TARGET_PRICE_DISPLAY_MIN_FONT_SIZE = 28;

function countDecimalPlaces(value: string): number {
  const [, fraction] = value.split('.');
  return fraction?.length ?? 0;
}

function getTargetPriceDisplayFontStyle(value: string) {
  const decimalPlaces = countDecimalPlaces(value);
  if (decimalPlaces <= TARGET_PRICE_DISPLAY_DECIMAL_THRESHOLD) {
    return {
      fontSize: TARGET_PRICE_DISPLAY_BASE_FONT_SIZE,
      lineHeight: TARGET_PRICE_DISPLAY_BASE_LINE_HEIGHT,
    };
  }

  const extraDecimals = decimalPlaces - TARGET_PRICE_DISPLAY_DECIMAL_THRESHOLD;
  const fontSize = Math.max(
    TARGET_PRICE_DISPLAY_MIN_FONT_SIZE,
    TARGET_PRICE_DISPLAY_BASE_FONT_SIZE -
      extraDecimals * TARGET_PRICE_DISPLAY_FONT_STEP,
  );
  const lineHeight = Math.round(
    fontSize *
      (TARGET_PRICE_DISPLAY_BASE_LINE_HEIGHT /
        TARGET_PRICE_DISPLAY_BASE_FONT_SIZE),
  );

  return { fontSize, lineHeight };
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function WalletLimitOrder({
  onViewOrdersPress,
  onCastAboutOrderPress,
  onSelectTokenPress,
  onSelectFundingTokenPress,
  onBack,
  scrollOffset,
  panGestureRef,
}: {
  onViewOrdersPress: () => void;
  onCastAboutOrderPress: (
    params: NonNullable<CreateCastParams['params']>,
  ) => void;
  onSelectTokenPress: () => void;
  onSelectFundingTokenPress: () => void;
  // Web has no sheet gesture to dismiss the flow — the wrapper passes goBack so
  // a back affordance can be rendered in the header.
  onBack?: () => void;
  scrollOffset?: SharedValue<number>;
  panGestureRef?: React.RefObject<unknown> | null;
}) {
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const insets = useOptionalSafeAreaInsets();
  const limitOrdersEnabled = useLimitOrdersEnabled();
  const [showExpirySheet, setShowExpirySheet] = React.useState(false);
  const [showReviewSheet, setShowReviewSheet] = React.useState(false);
  const renderReviewBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  );
  const {
    kind,
    selectedToken,
    targetPrice,
    setTargetPrice,
    amountUsd,
    setAmountUsd,
    expiry,
    setExpiry,
    activeInput,
    setActiveInput,
    fundingToken,
    fundingTokenAvailableUsd,
    selectedTokenAvailableUsd,
    selectedTokenAvailableQuantity,
    currentPriceUsd,
    targetPriceMaxDecimals,
    percentChange,
    warning,
    error,
    submitError,
    createdOrder,
    state,
    canSubmit,
    selectPercentage,
    prepare,
    submit,
  } = useWalletLimitOrder();
  const promptedForTokenRef = React.useRef(false);
  const trackedSuccessOrderIdRef = React.useRef<string | undefined>(undefined);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollOffset) {
        scrollOffset.value = event.contentOffset.y;
      }
    },
  });
  const LimitOrderScrollView = scrollOffset ? AnimatedScrollView : RNScrollView;
  const limitOrderScrollViewProps = scrollOffset
    ? {
        onScroll: scrollHandler,
        scrollEventThrottle: 16 as const,
        simultaneousHandlers: panGestureRef,
      }
    : {};

  const analyticsProperties = React.useMemo(
    () => ({
      version: '1',
      kind,
      chain: selectedToken?.chain,
      token: selectedToken
        ? toAnalyticsName(tokenLinkToMinimalToken(selectedToken))
        : undefined,
      fundingToken: fundingToken
        ? toAnalyticsName(tokenLinkToMinimalToken(fundingToken))
        : undefined,
      amountUsd: Number(normalizeInput(amountUsd)),
      targetPriceUsd: Number(normalizeInput(targetPrice)),
      percentChange,
      expiry,
    }),
    [
      amountUsd,
      expiry,
      fundingToken,
      kind,
      percentChange,
      selectedToken,
      targetPrice,
    ],
  );

  useSafeFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewWalletLimitOrder, {
        version: '1',
        kind,
      });
    }, [kind, trackEvent]),
  );

  React.useEffect(() => {
    if (state === 'success') {
      setShowReviewSheet(false);
    }
  }, [state]);

  React.useEffect(() => {
    if (
      state !== 'success' ||
      !createdOrder ||
      trackedSuccessOrderIdRef.current === createdOrder.id
    ) {
      return;
    }

    trackedSuccessOrderIdRef.current = createdOrder.id;
    trackEvent(AnalyticsEvent.ViewWalletLimitOrderSuccess, {
      ...analyticsProperties,
      orderId: createdOrder.id,
      status: createdOrder.status,
    });
  }, [analyticsProperties, createdOrder, state, trackEvent]);

  const maxDecimals = React.useMemo(() => {
    if (activeInput === 'amountUsd') {
      return 2;
    }
    return targetPriceMaxDecimals;
  }, [activeInput, targetPriceMaxDecimals]);

  React.useEffect(() => {
    if (!limitOrdersEnabled) {
      return;
    }
    // On web the flow is a page, not a dismissible sheet: auto-pushing the
    // token picker means backing out of it returns to an empty screen that
    // instantly re-pushes the picker (a loop). Show the "Choose token" button
    // instead and let the user open the picker explicitly.
    if (Platform.OS === 'web') {
      return;
    }
    if (!selectedToken && !promptedForTokenRef.current) {
      promptedForTokenRef.current = true;
      onSelectTokenPress();
    }
  }, [limitOrdersEnabled, onSelectTokenPress, selectedToken]);

  const handleNumpadChange = React.useCallback(
    (value: string) => {
      if (activeInput === 'targetPrice') {
        setTargetPrice(value);
      } else {
        setAmountUsd(value);
      }
    },
    [activeInput, setAmountUsd, setTargetPrice],
  );

  const activeValue = activeInput === 'targetPrice' ? targetPrice : amountUsd;
  const amountNumber = Number(normalizeInput(amountUsd));
  const parsedTargetPrice = Number(normalizeInput(targetPrice));
  const parsedAmountUsd = Number(normalizeInput(amountUsd));
  const formattedTargetPrice = React.useMemo(
    () =>
      formatTargetPriceInput(
        targetPrice,
        targetPriceMaxDecimals,
        selectedToken?.priceUsd,
        currentPriceUsd,
        activeInput === 'targetPrice',
      ),
    [
      activeInput,
      currentPriceUsd,
      selectedToken?.priceUsd,
      targetPrice,
      targetPriceMaxDecimals,
    ],
  );
  const targetPriceFontStyle = React.useMemo(
    () => getTargetPriceDisplayFontStyle(formattedTargetPrice),
    [formattedTargetPrice],
  );
  const roundedPercentChange =
    percentChange === undefined ? undefined : Math.round(percentChange);
  const percentLabel =
    roundedPercentChange === undefined || roundedPercentChange === 0
      ? undefined
      : `${roundedPercentChange > 0 ? '+' : ''}${roundedPercentChange}%`;
  const hasInsufficientBalance = React.useMemo(() => {
    if (parsedAmountUsd <= 0) {
      return false;
    }
    if (kind === 'buy') {
      return usdAmountExceedsBalance(parsedAmountUsd, fundingTokenAvailableUsd);
    }
    if (parsedTargetPrice <= 0) {
      return false;
    }
    return sellUsdAmountExceedsBalance(
      parsedAmountUsd,
      parsedTargetPrice,
      selectedTokenAvailableQuantity,
    );
  }, [
    fundingTokenAvailableUsd,
    kind,
    parsedAmountUsd,
    parsedTargetPrice,
    selectedTokenAvailableQuantity,
  ]);
  const hasTargetPriceError =
    !!error &&
    !error.startsWith('Enter an amount to') &&
    error !== 'Amount exceeds available balance';
  const canRetrySubmit = Boolean(submitError) && state === 'error';
  const reviewButtonTitle = React.useMemo(() => {
    if (canRetrySubmit) {
      return 'Try again';
    }
    if (hasInsufficientBalance) {
      const token = kind === 'buy' ? fundingToken : selectedToken;
      if (token) {
        return `Not enough ${formatTokenSymbol(token.ticker)}`;
      }
    }
    return 'Review limit order';
  }, [
    canRetrySubmit,
    fundingToken,
    hasInsufficientBalance,
    kind,
    selectedToken,
  ]);
  const hasUnfavorableTargetPrice =
    percentChange !== undefined &&
    parsedTargetPrice > 0 &&
    ((kind === 'buy' && percentChange > 0) ||
      (kind === 'sell' && percentChange < 0));
  const hasLargeFavorableTargetPriceOffset =
    percentChange !== undefined &&
    ((kind === 'buy' && percentChange <= -90) ||
      (kind === 'sell' && percentChange >= 90));
  const targetPriceWarning = hasLargeFavorableTargetPriceOffset
    ? `Price is more than 90% ${kind === 'buy' ? 'below' : 'above'} market.`
    : warning;
  const targetTone = hasUnfavorableTargetPrice
    ? 'danger'
    : hasLargeFavorableTargetPriceOffset
      ? 'warning'
      : 'secondary';
  const targetPriceColor =
    targetTone !== 'secondary'
      ? targetTone
      : activeInput === 'targetPrice'
        ? 'primary'
        : 'secondary';
  const orderTitle = kind === 'buy' ? 'Limit Buy' : 'Limit Sell';
  const orderVerb = kind === 'buy' ? 'Buy' : 'Sell';
  const sellTokenTicker =
    kind === 'buy'
      ? (fundingToken?.ticker ?? 'token')
      : (selectedToken?.ticker ?? 'token');
  const isPlacingOrder = state === 'approving' || state === 'submitting';
  const placeOrderButtonTitle = canRetrySubmit
    ? 'Try again'
    : state === 'approving'
      ? `Approve ${sellTokenTicker}`
      : 'Place limit order';
  const handleAvailablePress = onSelectFundingTokenPress;
  const availableBalanceToken = fundingToken;
  const availableBalanceUsd = fundingTokenAvailableUsd;
  const limitOrderUnavailable =
    !limitOrdersEnabled ||
    (!!selectedToken && selectedToken.features?.canLimitOrder !== true);
  const percentageShortcutsDisabled =
    limitOrderUnavailable || activeInput !== 'amountUsd';
  const createdOrderDetails = React.useMemo(() => {
    if (!createdOrder) {
      return undefined;
    }

    const primaryToken =
      createdOrder.kind === 'buy'
        ? createdOrder.buyToken
        : createdOrder.sellToken;
    const amountToken = primaryToken;
    const amount =
      createdOrder.kind === 'buy'
        ? createdOrder.buyAmount
        : createdOrder.sellAmount;
    const tokenName =
      primaryToken.name ||
      primaryToken.symbol ||
      selectedToken?.name ||
      'Token';
    const amountLabel = `${formatOrderTokenAmount(
      amount,
      amountToken.decimals,
    )} ${amountToken.symbol ?? ''}`.trim();
    const statusLabel = orderStatusLabels[createdOrder.status];

    return {
      primaryToken,
      tokenName,
      amountLabel,
      statusLabel,
    };
  }, [createdOrder, selectedToken?.name]);

  const handleViewOrders = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickLimitOrderViewOrders, analyticsProperties);
    onViewOrdersPress();
  }, [analyticsProperties, onViewOrdersPress, trackEvent]);

  const handleCastAboutOrder = React.useCallback(() => {
    if (!createdOrderDetails) {
      return;
    }

    trackEvent(
      AnalyticsEvent.ClickLimitOrderCastAboutThis,
      analyticsProperties,
    );
    onCastAboutOrderPress({
      intent: {
        text: '',
        embeds: [],
        mentions: [],
        tokenKey: buildCaip19TokenUri(
          createdOrderDetails.primaryToken.chain,
          createdOrderDetails.primaryToken.ca,
        ),
      },
    });
  }, [
    analyticsProperties,
    createdOrderDetails,
    onCastAboutOrderPress,
    trackEvent,
  ]);

  const reviewAmountUsd = formatDisplayDollars(parsedAmountUsd);

  if (state === 'success' && createdOrder && createdOrderDetails) {
    const createdOrderFailed = createdOrder.status === 'failed';

    return (
      <View style={[t.flex1, t.bgDefault, { paddingBottom: insets.bottom }]}>
        <View style={[t.itemsCenter, t.pT2]}>
          <View
            style={[t.bgPromptHandle, t.w12, { height: 4, borderRadius: 2 }]}
          />
        </View>

        <View style={[t.flex1, t.justifyBetween, t.pX4, t.pB3]}>
          <View style={[t.itemsCenter, { paddingTop: 52 }]}>
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <View
                style={[
                  t.itemsCenter,
                  t.justifyCenter,
                  {
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: createdOrderFailed
                      ? t.colors.text.danger
                      : t.colors.background.brand,
                  },
                ]}
              >
                <Hourglass size={12} color={t.colors.text.light} />
              </View>
              <Text2 weight="bold" size="lg">
                {createdOrderFailed ? 'Order failed' : 'Order placed'}
              </Text2>
            </View>

            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyCenter,
                t.mT5,
                { gap: 12 },
              ]}
            >
              <TokenIcon
                iconUrl={createdOrderDetails.primaryToken.imageUrl}
                diameter={42}
                chain={createdOrderDetails.primaryToken.chain}
                symbol={createdOrderDetails.primaryToken.symbol}
                features={createdOrderDetails.primaryToken.features}
              />
              <Text2 weight="regular" size="5xl" numberOfLines={1}>
                {createdOrderDetails.tokenName}
              </Text2>
            </View>

            <View style={[t.wFull, t.mT7, { gap: 14 }]}>
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 color="secondary" size="base">
                  Status
                </Text2>
                <Text2
                  color={createdOrderFailed ? 'danger' : 'brand'}
                  size="base"
                  weight="medium"
                >
                  {createdOrderDetails.statusLabel}
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 color="secondary" size="base">
                  Amount
                </Text2>
                <Text2 color="secondary" size="base" weight="medium">
                  {createdOrderDetails.amountLabel}
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 color="secondary" size="base">
                  Trigger
                </Text2>
                <Text2 color="secondary" size="base" weight="medium">
                  Price reaches {formatPrice(parsedTargetPrice)}
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 color="secondary" size="base">
                  Expires
                </Text2>
                <Text2 color="warning" size="base" weight="medium">
                  {expiryLabels[expiry]}
                </Text2>
              </View>
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 color="secondary" size="base">
                  Gas
                </Text2>
                <Text2 color="secondary" size="base" weight="medium">
                  None until filled
                </Text2>
              </View>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <ButtonV2
              title="View orders"
              onPress={handleViewOrders}
              variant="secondary"
              width="full"
              textSize="lg"
            />
            {Platform.OS !== 'web' && (
              <ButtonV2
                title="Cast about this"
                onPress={handleCastAboutOrder}
                width="full"
                textSize="lg"
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[t.flex1, t.bgDefault]}>
      <View style={[t.itemsCenter, t.pT2]}>
        <View
          style={[t.bgPromptHandle, t.w12, { height: 4, borderRadius: 2 }]}
        />
      </View>
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.pX4, t.pY4]}>
        {Platform.OS === 'web' && onBack ? (
          <AnimatedPressable onPress={onBack} style={[{ width: 40 }]}>
            <ChevronLeft size={24} color={t.colors.text.primary} />
          </AnimatedPressable>
        ) : (
          <View style={[{ width: 40 }]} />
        )}
        <Text2 weight="bold" size="lg">
          {orderTitle}
        </Text2>
      </View>

      <LimitOrderScrollView
        style={[t.flex1]}
        contentContainerStyle={[t.pX3, t.pB3, { gap: 18 }]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        {...limitOrderScrollViewProps}
      >
        {!limitOrdersEnabled ? (
          <View style={[t.backgrounds.secondary, t.roundedLg, t.p3]}>
            <Text2 color="danger" align="center" weight="semibold" size="sm">
              {LIMIT_ORDERS_UNAVAILABLE_ACCOUNT_MESSAGE}
            </Text2>
          </View>
        ) : null}

        {selectedToken ? (
          kind === 'sell' ? (
            <TokenListItem
              token={selectedToken}
              variant="balance"
              pressableAnimationsDisabled
              ownedValue={selectedTokenAvailableUsd}
              ownedAmount={selectedTokenAvailableQuantity}
              shouldHideBalance={true}
              hideEarnings={true}
              subtitle={selectedToken.ticker}
            />
          ) : (
            <TokenListItem
              token={selectedToken}
              variant="price"
              onPress={onSelectTokenPress}
              hideEarnings={true}
            />
          )
        ) : (
          <ButtonV2
            title="Choose token"
            onPress={onSelectTokenPress}
            variant="secondary"
            width="full"
          />
        )}

        <AnimatedPressable
          onPress={() => setActiveInput('targetPrice')}
          style={[t.itemsCenter, { gap: 8 }]}
        >
          <Text2 color="secondary" weight="semibold">
            When price reaches
          </Text2>
          <View style={[t.flexRow, t.itemsCenter, t.justifyCenter, { gap: 6 }]}>
            {percentLabel ? (
              <View style={[t.flexRow, t.itemsCenter, t.opacity0, { gap: 2 }]}>
                <Text2 color={targetTone} weight="semibold">
                  {percentLabel}
                </Text2>
                {percentChange !== undefined && percentChange > 0 ? (
                  <ArrowUpRight size={14} color={t.colors.text[targetTone]} />
                ) : (
                  <ArrowDownRight size={14} color={t.colors.text[targetTone]} />
                )}
              </View>
            ) : null}
            <Text2
              color={targetPriceColor}
              align="center"
              style={targetPriceFontStyle}
              numberOfLines={1}
            >
              ${formattedTargetPrice}
            </Text2>
            {percentLabel ? (
              <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                <Text2 color={targetTone} weight="semibold">
                  {percentLabel}
                </Text2>
                {percentChange !== undefined && percentChange > 0 ? (
                  <ArrowUpRight size={14} color={t.colors.text[targetTone]} />
                ) : (
                  <ArrowDownRight size={14} color={t.colors.text[targetTone]} />
                )}
              </View>
            ) : null}
          </View>
          {hasTargetPriceError ? (
            <View
              style={[
                t.backgrounds.secondary,
                t.roundedFull,
                { paddingHorizontal: 12, paddingVertical: 6 },
              ]}
            >
              <Text2 color="danger" weight="semibold" size="sm">
                {error}
              </Text2>
            </View>
          ) : targetPriceWarning ? (
            <View
              style={[
                t.backgrounds.secondary,
                t.roundedFull,
                { paddingHorizontal: 12, paddingVertical: 6 },
              ]}
            >
              <Text2 color="warning" weight="semibold" size="sm">
                {targetPriceWarning}
              </Text2>
            </View>
          ) : null}
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => setActiveInput('amountUsd')}
          style={[t.itemsCenter, { gap: 6 }]}
        >
          <Text2 color="secondary" weight="semibold">
            {orderVerb}
          </Text2>
          <Text2
            color={activeInput === 'amountUsd' ? 'primary' : 'secondary'}
            align="center"
            style={{ fontSize: 56, lineHeight: 64 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ${formatLargeInput(amountUsd, 2)}
          </Text2>
        </AnimatedPressable>

        <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <Pressable
            onPress={handleAvailablePress}
            style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          >
            {availableBalanceToken ? (
              <TokenIcon
                iconUrl={availableBalanceToken.imageUrl}
                chain={availableBalanceToken.chain}
                diameter={24}
                chainImageSize={13}
                symbol={availableBalanceToken.ticker}
              />
            ) : null}
            <Text2 weight="semibold">
              {formatDecimal(availableBalanceUsd)} available
            </Text2>
            <ChevronDown size={16} color={t.colors.text.primary} />
          </Pressable>
          <Pressable
            onPress={() => setShowExpirySheet(true)}
            style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          >
            <Text2 color="secondary" weight="semibold">
              Expiry
            </Text2>
            <Text2 weight="bold">{expiryLabels[expiry]}</Text2>
            <ChevronDown size={16} color={t.colors.text.primary} />
          </Pressable>
        </View>

        <View style={[t.flexRow, { gap: 12 }]}>
          {[
            { label: '10%', value: 0.1 },
            { label: '25%', value: 0.25 },
            { label: '50%', value: 0.5 },
            { label: 'Max', value: 1 },
          ].map((option) => (
            <AnimatedPressable
              key={option.label}
              onPress={() => {
                trackEvent(AnalyticsEvent.PressLimitOrderSelectorPct, {
                  ...analyticsProperties,
                  pct: option.value * 100,
                });
                selectPercentage(option.value);
              }}
              disabled={percentageShortcutsDisabled}
              style={[
                t.flex1,
                t.itemsCenter,
                t.backgrounds.secondary,
                t.roundedFull,
                { opacity: percentageShortcutsDisabled ? 0.4 : 1 },
                { paddingVertical: 8 },
              ]}
            >
              <Text2
                color={percentageShortcutsDisabled ? 'tertiary' : 'brand'}
                weight="bold"
              >
                {option.label}
              </Text2>
            </AnimatedPressable>
          ))}
        </View>
      </LimitOrderScrollView>

      <View
        style={[
          t.pX3,
          t.pT3,
          t.bgDefault,
          { gap: 12, flexShrink: 0 },
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <SwapNumPad
          value={activeValue}
          maxDecimals={maxDecimals}
          onChange={handleNumpadChange}
          disabled={limitOrderUnavailable}
          gap={10}
        />

        {submitError ? (
          <Text2 color="danger" align="center" size="sm">
            {submitError}
          </Text2>
        ) : null}

        <ButtonV2
          title={reviewButtonTitle}
          onPress={async () => {
            if (await prepare()) {
              trackEvent(AnalyticsEvent.LimitOrderReview, analyticsProperties);
              setShowReviewSheet(true);
            }
          }}
          loading={state === 'preparing'}
          disabled={
            !canSubmit ||
            amountNumber <= 0 ||
            state === 'success' ||
            hasInsufficientBalance
          }
          width="full"
        />
      </View>

      {showExpirySheet ? (
        <AutoDisplayingBottomSheetModal
          name="Wallet Limit Order Expiry"
          displayedInModalPresentationScreen={true}
          onDismiss={() => setShowExpirySheet(false)}
        >
          <View style={[t.flexRow, t.itemsCenter, t.mB4, { gap: 12 }]}>
            {selectedToken ? (
              <TokenIcon
                iconUrl={selectedToken.imageUrl}
                diameter={42}
                chain={selectedToken.chain}
                symbol={selectedToken.ticker}
                features={selectedToken.features}
              />
            ) : null}
            <View>
              <Text2 weight="bold">
                {selectedToken?.ticker ?? 'Token'} ({orderVerb})
              </Text2>
              <Text2 color="secondary">Set expiration</Text2>
            </View>
          </View>
          {(['1d', '7d', '30d', 'none'] as WalletLimitOrderExpiry[]).map(
            (option) => (
              <Pressable
                key={option}
                onPress={() => {
                  if (option !== expiry) {
                    trackEvent(AnalyticsEvent.LimitOrderChangeExpiry, {
                      ...analyticsProperties,
                      fromExpiry: expiry,
                      toExpiry: option,
                    });
                  }
                  setExpiry(option);
                  setShowExpirySheet(false);
                }}
                style={[
                  t.flexRow,
                  t.justifyBetween,
                  t.itemsCenter,
                  { paddingVertical: 14 },
                ]}
              >
                <View>
                  <Text2 color={option === expiry ? 'primary' : 'secondary'}>
                    {expiryLabels[option]}
                  </Text2>
                  {option === 'none' ? (
                    <Text2 color="secondary" size="sm">
                      Stays active until filled or manually cancelled
                    </Text2>
                  ) : null}
                </View>
                {option === expiry ? (
                  <Check size={24} color={t.colors.text.primary} />
                ) : null}
              </Pressable>
            ),
          )}
        </AutoDisplayingBottomSheetModal>
      ) : null}

      {showReviewSheet ? (
        <AutoDisplayingBottomSheetModal
          name="Wallet Limit Order Review"
          displayedInModalPresentationScreen={true}
          backdropComponent={renderReviewBackdrop}
          onDismiss={() => setShowReviewSheet(false)}
        >
          <View
            style={[
              t.flexCol,
              {
                gap: 22,
                minHeight: 620,
                paddingTop: 4,
                paddingBottom: 24,
              },
            ]}
          >
            {/* Header */}
            <Text2 color="secondary" weight="medium" size="base" align="center">
              Review order
            </Text2>

            {/* Core details */}
            <View style={[t.itemsCenter, { gap: 10 }]}>
              <Text2 color="secondary" size="sm" align="center">
                {orderVerb}
              </Text2>
              <Text2 weight="semibold" size="5xl" align="center">
                {reviewAmountUsd}
              </Text2>
              <Text2 color="secondary" size="sm" align="center">
                when {selectedToken?.ticker} price reaches
              </Text2>
              <Text2 weight="regular" size="5xl" align="center" style={[t.mT1]}>
                $
                {formatTargetPriceInput(
                  targetPrice,
                  targetPriceMaxDecimals,
                  selectedToken?.priceUsd,
                  currentPriceUsd,
                  false,
                )}
              </Text2>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.secondary,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <View
                style={[
                  t.flexRow,
                  t.justifyBetween,
                  t.itemsCenter,
                  { paddingHorizontal: 18, paddingVertical: 15 },
                ]}
              >
                <Text2 color="primary" weight="medium">
                  Expires
                </Text2>
                <Text2 color="warning" weight="medium">
                  {expiryLabels[expiry]}
                </Text2>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: t.colors.border.secondary,
                }}
              />

              {/* Row 2: Gas */}
              <View
                style={[
                  t.flexRow,
                  t.justifyBetween,
                  t.itemsCenter,
                  { paddingHorizontal: 18, paddingVertical: 15 },
                ]}
              >
                <Text2 color="primary" weight="medium">
                  Gas
                </Text2>
                <Text2 color="secondary">None (until filled)</Text2>
              </View>
            </View>

            {/* Note box */}
            <View
              style={[
                t.backgrounds.secondary,
                {
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                },
              ]}
            >
              <Text2 color="secondary" size="base" align="center">
                Limit orders are not guaranteed to fill; funds are moved only
                when order starts filling.
              </Text2>
            </View>

            {submitError ? (
              <Text2 color="danger" align="center" size="sm" weight="semibold">
                {submitError}
              </Text2>
            ) : null}

            {/* Action buttons */}
            <View style={[t.flexCol, { gap: 12, marginTop: 2 }]}>
              <ButtonV2
                title={placeOrderButtonTitle}
                onPress={async () => {
                  if (await prepare()) {
                    await submit();
                  }
                }}
                loading={isPlacingOrder || state === 'preparing'}
                disabled={!canSubmit || isPlacingOrder}
                width="full"
              />
              <ButtonV2
                title="Cancel"
                onPress={() => setShowReviewSheet(false)}
                variant="secondary"
                disabled={isPlacingOrder}
                width="full"
              />
            </View>
          </View>
        </AutoDisplayingBottomSheetModal>
      ) : null}
    </View>
  );
}
