import { ApiTokenLink, formatDecimal } from 'farcaster-client-data';
import {
  ChevronDownIcon,
  CreditCardIcon,
  GiftIcon,
  SquarePercentIcon,
  TriangleAlertIcon,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../../contexts';
import { formatFee } from '../../../../utils';
import {
  AnimatedPressable,
  Text2,
  TextPlaceholder,
  Typography,
} from '../../../design-system';
import { FarcasterProBadge } from '../../../farcasterPro';
import { TokenIcon } from '../TokenIcon';
import { SwapTokensDetailsSheet } from './SwapTokensDetailsSheet';
import { useSwapDetailsBottomSheet } from './useSwapDetailsBottomSheet';
import { useSwapFees } from './useSwapFees';
import { useSwapPriceImpact } from './useSwapPriceImpact';
import { PreparedQuote } from './useSwapQuotes';

function SwapTokensPriceImpactWarning({
  priceImpactUsd,
  type,
}: {
  type: 'high_price_impact_danger' | 'high_price_impact_warning';
  priceImpactUsd: number;
}) {
  const t = useTheme();
  const background = useMemo(() => {
    return type === 'high_price_impact_danger'
      ? t.backgrounds.danger
      : t.backgrounds.warning;
  }, [type, t.backgrounds.danger, t.backgrounds.warning]);

  const textColor = type === 'high_price_impact_danger' ? 'danger' : 'warning';
  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
      <View
        style={[background, t.pY1, { paddingHorizontal: 6, borderRadius: 12 }]}
      >
        <Typography label="Body/Medium/Strong" color={textColor}>
          {formatDecimal(priceImpactUsd)} impact
        </Typography>
      </View>
    </View>
  );
}

export function SwapTokenDropdownSelector({
  onPress,
  token,
  availableUsdValue,
  preparedQuote,
  isPro,
  isReferralProgram,
  isNoFeeAllowlisted,
  priceImpact,
  onShowSettings,
  warning,
  isFetching,
  assetPickerType,
}: {
  onPress: () => void;
  token: ApiTokenLink | undefined;
  availableUsdValue: number;
  preparedQuote: PreparedQuote | undefined;
  isPro: boolean;
  isReferralProgram: boolean;
  isNoFeeAllowlisted: boolean;
  priceImpact: number;
  onShowSettings: () => void;
  warning: string | undefined;
  isFetching: boolean;
  assetPickerType: 'crypto' | 'cash';
  sellAmount: string;
}) {
  const t = useTheme();
  const showingDetailsSheetProgress = useSharedValue(0);
  const quote = preparedQuote?.quote;
  const { others, farcaster } = useSwapFees({
    fees: preparedQuote?.quote?.fees,
    isPro,
    isNoFeeAllowlisted,
    priceImpact,
  });
  const { priceImpactUsd, showHighPriceImpactWarning, showPriceImpactWarning } =
    useSwapPriceImpact();
  const { showDetailsSheet, setShowDetailsSheet } = useSwapDetailsBottomSheet();
  const handlePressFees = useCallback(() => {
    showingDetailsSheetProgress.value = withTiming(1, { duration: 200 });
    setShowDetailsSheet(true);
  }, [setShowDetailsSheet, showingDetailsSheetProgress]);

  const hideDetailsSheet = useCallback(() => {
    showingDetailsSheetProgress.value = withTiming(0, { duration: 100 });
    setShowDetailsSheet(false);
  }, [setShowDetailsSheet, showingDetailsSheetProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${showingDetailsSheetProgress.value * 180}deg` }],
    };
  }, [showingDetailsSheetProgress]);

  return (
    <>
      <View
        style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.p4, t.gap2_5]}
      >
        <AnimatedPressable onPress={onPress}>
          <View style={[t.itemsStart, t.gap2_5]}>
            {assetPickerType === 'cash' ? (
              <CreditCardIcon
                style={t.mL4}
                size={24}
                color={t.colors.text.primary}
              />
            ) : (
              <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                {token ? (
                  <>
                    <TokenIcon
                      iconUrl={token.imageUrl}
                      chain={token.chain}
                      diameter={24}
                      chainImageSize={13}
                      symbol={token.ticker}
                    />
                    <Typography label="Body/Medium/Strong">
                      {formatDecimal(availableUsdValue)} available
                    </Typography>
                    <ChevronDownIcon
                      size={18}
                      color={t.colors.text.primary}
                      style={{ marginLeft: -4 }}
                    />
                  </>
                ) : (
                  <TextPlaceholder width={100} size="base" />
                )}
              </View>
            )}
          </View>
        </AnimatedPressable>
        <View style={[t.itemsCenter, t.gap2]}>
          {warning && (
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.gap1,
                t.roundedFull,
                t.backgrounds.secondary,
                { paddingVertical: 2, paddingHorizontal: 6 },
              ]}
            >
              <TriangleAlertIcon size={12} color={t.colors.text.secondary} />
              <Typography label="Body/ExtraSmall/Strong" color="secondary">
                {warning}
              </Typography>
            </View>
          )}
          {quote && !isFetching && assetPickerType === 'crypto' ? (
            showHighPriceImpactWarning ? (
              <AnimatedPressable
                disabled={!quote}
                onPress={handlePressFees}
                style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}
              >
                <SwapTokensPriceImpactWarning
                  type="high_price_impact_danger"
                  priceImpactUsd={priceImpactUsd}
                />
              </AnimatedPressable>
            ) : showPriceImpactWarning ? (
              <AnimatedPressable
                disabled={!quote}
                onPress={handlePressFees}
                style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}
              >
                <SwapTokensPriceImpactWarning
                  type="high_price_impact_warning"
                  priceImpactUsd={priceImpactUsd}
                />
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                disabled={!quote}
                onPress={handlePressFees}
                style={[t.flex, t.flexRow, t.itemsCenter, t.gap1]}
              >
                {isNoFeeAllowlisted ? (
                  <View style={[t.flex, t.flexRow, t.itemsCenter, t.gap1]}>
                    <GiftIcon size={15} color={t.colors.text.brand} />
                    <Text2 size="sm" weight="medium" color="brand">
                      {formatFee(farcaster.walletFee)}
                    </Text2>
                  </View>
                ) : isPro ? (
                  <View style={[t.flex, t.flexRow, t.itemsCenter, t.gap1]}>
                    <FarcasterProBadge size={15} color={t.colors.text.brand} />
                    <Text2 size="sm" weight="medium" color="brand">
                      {formatFee(farcaster.walletFee)}
                    </Text2>
                  </View>
                ) : isReferralProgram ? (
                  <View style={[t.flex, t.flexRow, t.itemsCenter, t.gap1]}>
                    <SquarePercentIcon size={15} color={t.colors.text.brand} />
                    <Text2 size="sm" weight="medium" color="brand">
                      {formatFee(others.walletFee - others.referralFee)}
                    </Text2>
                  </View>
                ) : (
                  <View
                    style={[
                      t.backgrounds.brandLight,
                      {
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <Text2 size="xs" weight="semibold" color="brand">
                      Reduce fees with Pro
                    </Text2>
                  </View>
                )}
                <Text2
                  size="sm"
                  weight="medium"
                  color="tertiary"
                  style={[
                    (isPro || isReferralProgram) && {
                      textDecorationLine: 'line-through',
                    },
                  ]}
                >
                  {formatFee(others.walletFee) ?? ''}
                </Text2>
                <Animated.View style={animatedStyle}>
                  <ChevronDownIcon size={18} color={t.colors.text.primary} />
                </Animated.View>
              </AnimatedPressable>
            )
          ) : isFetching && assetPickerType === 'crypto' ? (
            <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <TextPlaceholder width={56} size="sm" />
              <TextPlaceholder width={116} size="sm" />
            </View>
          ) : null}
        </View>
      </View>
      {showDetailsSheet && (
        <SwapTokensDetailsSheet
          onDismiss={hideDetailsSheet}
          isPro={isPro}
          isNoFeeAllowlisted={isNoFeeAllowlisted}
          isReferralProgram={isReferralProgram}
          fees={preparedQuote?.quote?.fees ?? undefined}
          onShowSettings={onShowSettings}
        />
      )}
    </>
  );
}
