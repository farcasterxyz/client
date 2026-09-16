import { ApiChain, ApiTokenLink, isUsdc } from 'farcaster-client-data';
import type { ApiTokenBonus } from 'farcaster-client-data/src/types/api';
import {
  formatBalance,
  formatPrice,
  formatTimeAgo,
  formatTokenName,
  formatTokenStat,
  useGloballyCachedToken,
} from 'farcaster-client-hooks';
import isEqual from 'fast-deep-equal';
import { Triangle } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { WALLET_PREFETCH_CONFIG } from '../../../constants';
import { useTheme } from '../../../contexts';
import { useCachedOrQueryToken, useWalletBalancesHidden } from '../../../hooks';
import {
  AnimatedPressable,
  SkeletonPlaceholder,
  Text2,
  TextPlaceholder,
} from '../../design-system';
import { DepositBonusStatsBottomSheet } from '../../wallet/tokens/WalletTokenBalances';
import { TokenBadges } from './TokenBadges';
import { TokenIcon } from './TokenIcon';

export const TokenListItemWithoutToken = memo(
  function TokenListItemWithoutToken({
    chain,
    ca,
    variant = 'default',
    onPress,
  }: {
    chain: ApiChain;
    ca: string;
    variant?: 'default' | 'price' | 'balance' | 'search';
    onPress: (token: ApiTokenLink) => void;
  }) {
    const { data: token } = useCachedOrQueryToken({
      chain,
      ca,
    });

    const wrappedOnPress = useCallback(() => {
      if (token) {
        onPress(token);
      }
    }, [onPress, token]);

    if (!token) {
      return null;
    }

    return (
      <TokenListItem token={token} variant={variant} onPress={wrappedOnPress} />
    );
  },
);

type TokenListItemProps = {
  token: ApiTokenLink;
  variant?:
    | 'default'
    | 'price'
    | 'balance'
    | 'search'
    | 'onramp'
    | 'swap'
    | 'pulse';
  onPress?: (token: ApiTokenLink) => void;
  onPressIn?: (token: ApiTokenLink) => void;
  hideChain?: boolean;
  hidePriceChange?: boolean;
  subtitle?: string;
  subtitleComponent?: React.ReactElement;
  ownedAmount?: number;
  ownedValue?: number;
  shouldHideBalance?: boolean;
  pressableAnimationsDisabled?: boolean;
  bonuses?: ApiTokenBonus[];
  green?: string;
  right?: React.ReactElement;
  tokenIconDiameter?: number;
  hideEarnings?: boolean;
};

// Custom comparison function to compare props that matter for rendering
const areTokenListItemPropsEqual = (
  prevProps: TokenListItemProps,
  nextProps: TokenListItemProps,
) => {
  const { token: prevToken, onPress: _prevOnPress, ...prevRest } = prevProps;
  const { token: nextToken, onPress: _nextOnPress, ...nextRest } = nextProps;

  if (!isEqual(prevRest, nextRest)) {
    return false;
  }

  if (
    prevToken.ca !== nextToken.ca ||
    prevToken.chain !== nextToken.chain ||
    prevToken.name !== nextToken.name ||
    prevToken.ticker !== nextToken.ticker ||
    prevToken.imageUrl !== nextToken.imageUrl ||
    prevToken.priceUsd !== nextToken.priceUsd ||
    prevToken.marketCap !== nextToken.marketCap ||
    prevToken.fdv !== nextToken.fdv ||
    prevToken.source?.createdAt !== nextToken.source?.createdAt ||
    prevToken.source?.platform !== nextToken.source?.platform ||
    prevToken.priceChangePct?.h6 !== nextToken.priceChangePct?.h6
  ) {
    return false;
  }

  // Compare bonuses for deposit bonus detection
  if (!isEqual(prevProps.bonuses, nextProps.bonuses)) {
    return false;
  }

  return true;
};

export const TokenListItem = memo(function TokenListItem({
  token: fallbackToken,
  variant = 'default',
  onPress,
  onPressIn,
  hideChain = false,
  subtitle,
  subtitleComponent,
  hidePriceChange = false,
  ownedAmount,
  ownedValue,
  shouldHideBalance = true,
  pressableAnimationsDisabled,
  bonuses,
  green,
  right,
  tokenIconDiameter = 40,
  hideEarnings = false,
}: TokenListItemProps) {
  const token = useGloballyCachedToken({ fallback: fallbackToken });

  const t = useTheme();

  const wrappedOnPress = useCallback(() => {
    onPress?.(token);
  }, [onPress, token]);

  const wrappedOnPressIn = useCallback(() => {
    onPressIn?.(token);
  }, [onPressIn, token]);

  // Bottom sheet state and handlers
  const [showBonusStats, setShowBonusStats] = useState(false);
  const bonusStatsRef = useRef<{ dismiss: () => void }>(null);

  const handleEarningPress = useCallback(() => {
    setShowBonusStats(true);
  }, []);

  const handleBonusStatsDismiss = useCallback(() => {
    setShowBonusStats(false);
  }, []);

  const isNoChange =
    !hidePriceChange &&
    token.priceChangePct?.h6 !== undefined &&
    Math.abs(token.priceChangePct?.h6) < 0.01;

  const isPositiveChange =
    !isNoChange &&
    !hidePriceChange &&
    token.priceChangePct?.h6 !== undefined &&
    token.priceChangePct?.h6 > 0 &&
    token.priceChangePct?.h6 < 10_000;

  const isNegativeChange =
    !isNoChange &&
    !hidePriceChange &&
    token.priceChangePct?.h6 !== undefined &&
    token.priceChangePct?.h6 < 0 &&
    token.priceChangePct?.h6 > -10_000;

  const isStableCoin = useMemo(() => isUsdc(token.ca), [token.ca]);

  const [balancesHidden] = useWalletBalancesHidden();
  const hideBalance = balancesHidden && shouldHideBalance;

  const value = useMemo(() => {
    if (hideBalance && variant === 'balance') {
      return '*****';
    }

    if (variant === 'balance') {
      return ownedValue
        ? formatPrice(ownedValue, { showPositiveSign: false })
        : '';
    }

    if (variant === 'price') {
      return token.priceUsd
        ? formatPrice(token.priceUsd, { showPositiveSign: false })
        : '';
    }

    return formatTokenStat(token.marketCap ?? token.fdv);
  }, [
    variant,
    ownedValue,
    token.priceUsd,
    token.marketCap,
    token.fdv,
    hideBalance,
  ]);

  const tokenName = useMemo(() => {
    return formatTokenName(token.name, token.ca, token.chain);
  }, [token.name, token.ca, token.chain]);

  const formattedBalance = useMemo(() => {
    if (hideBalance) {
      return `*** ${token.ticker}`;
    }
    if (!ownedAmount) {
      return `0 ${token.ticker}`;
    }
    return `${formatBalance(ownedAmount)} ${token.ticker}`;
  }, [ownedAmount, token.ticker, hideBalance]);

  const formattedTimeAgo = useMemo(() => {
    const createdAt = token.source?.createdAt;
    if (!createdAt) {
      return '';
    }
    return formatTimeAgo(createdAt);
  }, [token.source?.createdAt]);

  const formattedPriceChange = useMemo(() => {
    const priceChange = token.priceChangePct?.h6;
    if (!priceChange || Math.abs(priceChange) >= 10_000) {
      return '';
    } else if (isNoChange) {
      return '0.00%';
    }

    return `${Math.abs(priceChange).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }, [isNoChange, token.priceChangePct?.h6]);

  // Check if there's a deposit bonus for this token
  const hasEligibleDepositBonus = useMemo(() => {
    if (hideEarnings) {
      return false;
    }

    return (
      bonuses?.find((bonus) => bonus.type === 'deposit')?.eligibleAmount ||
      false
    );
  }, [bonuses, hideEarnings]);

  const bonusTextAndColor: { text: string; color: string } | undefined =
    useMemo(() => {
      return bonuses?.length && hasEligibleDepositBonus
        ? { text: 'Earning 10%*', color: green || t.colors.text.success }
        : undefined;
    }, [hasEligibleDepositBonus, bonuses, green, t.colors.text.success]);

  return (
    <>
      <AnimatedPressable
        style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 8 }]}
        onPress={wrappedOnPress}
        onPressIn={
          WALLET_PREFETCH_CONFIG.PREFETCH_ON_PRESS_IN
            ? wrappedOnPressIn
            : undefined
        }
        // We don't need to define a hitSlop here because it will take the full row on
        // rendering list automatically.
        hitSlop={{}}
        disabled={!onPress && !onPressIn}
        disableAnimation={
          pressableAnimationsDisabled || (!onPress && !onPressIn)
        }
      >
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={tokenIconDiameter}
          chain={hideChain ? undefined : token.chain}
          symbol={token.ticker}
          features={token.features}
          badgeOffset={{ top: -2, right: -2 }}
          imageBordered
        />
        <View
          style={[
            t.flex1,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 36 },
          ]}
        >
          <View
            style={[
              t.flex1,
              t.itemsStart,
              t.justifyCenter,
              t.flexShrink,
              { gap: 2 },
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              {variant === 'pulse' && (
                <Text2
                  weight={'medium'}
                  numberOfLines={1}
                  style={Platform.OS === 'web' ? { maxWidth: 250 } : undefined}
                >
                  {token.ticker}
                </Text2>
              )}
              {variant !== 'pulse' && (
                <Text2
                  weight={variant === 'balance' ? 'semibold' : 'medium'}
                  numberOfLines={1}
                  style={Platform.OS === 'web' ? { maxWidth: 250 } : undefined}
                >
                  {tokenName}
                </Text2>
              )}

              <TokenBadges token={token} sheetEnabled={variant === 'balance'} />
              {ownedAmount && variant !== 'balance' ? (
                <View
                  style={[
                    { width: 16, height: 16 },
                    t.justifyCenter,
                    t.itemsCenter,
                    t.roundedFull,
                    t.backgrounds.tertiary,
                  ]}
                >
                  <Svg height={9} width={9} viewBox="0 0 512 512">
                    <Path
                      fill={t.colors.text.tertiary}
                      d="M95.5,104h320a87.73,87.73,0,0,1,11.18.71,66,66,0,0,0-77.51-55.56L86,94.08l-.3,0a66,66,0,0,0-41.07,26.13A87.57,87.57,0,0,1,95.5,104Z"
                    />
                    <Path
                      fill={t.colors.text.tertiary}
                      d="M415.5,128H95.5a64.07,64.07,0,0,0-64,64V384a64.07,64.07,0,0,0,64,64h320a64.07,64.07,0,0,0,64-64V192A64.07,64.07,0,0,0,415.5,128ZM368,320a32,32,0,1,1,32-32A32,32,0,0,1,368,320Z"
                    />
                    <Path
                      fill={t.colors.text.tertiary}
                      d="M32,259.5V160c0-21.67,12-58,53.65-65.87C121,87.5,156,87.5,156,87.5s23,16,4,16S141.5,128,160,128s0,23.5,0,23.5L85.5,236Z"
                    />
                  </Svg>
                </View>
              ) : null}
            </View>
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              {subtitleComponent ? (
                subtitleComponent
              ) : subtitle ? (
                <Text2 color="tertiary" weight="medium" size="sm">
                  {subtitle}
                </Text2>
              ) : variant === 'balance' ? (
                <Text2 color="tertiary" weight="medium" size="sm">
                  {formattedBalance}
                </Text2>
              ) : (
                <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                  <Text2
                    color="tertiary"
                    weight="medium"
                    numberOfLines={1}
                    style={[t.flexShrink, { fontSize: 13, lineHeight: 15 }]}
                  >
                    {token.ticker}
                  </Text2>
                  {formattedTimeAgo && (
                    <>
                      <Text2
                        color="tertiary"
                        weight="medium"
                        style={{ fontSize: 13, lineHeight: 15 }}
                      >
                        ∙
                      </Text2>
                      <Text2
                        color="tertiary"
                        weight="medium"
                        numberOfLines={1}
                        style={{ fontSize: 13, lineHeight: 15 }}
                      >
                        {formattedTimeAgo}
                      </Text2>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
          <View
            style={[
              t.flexNone,
              t.flexCol,
              t.itemsEnd,
              { gap: 2 },
              variant === 'onramp' ? { display: 'none' } : {},
            ]}
          >
            {value && (
              <Text2
                weight="medium"
                color={
                  hideBalance && variant === 'balance' ? 'secondary' : 'primary'
                }
              >
                {value}
              </Text2>
            )}
            {value && bonusTextAndColor && (
              <AnimatedPressable onPress={handleEarningPress}>
                <Text2
                  size="sm"
                  weight="medium"
                  style={{
                    color: bonusTextAndColor.color || t.colors.text.tertiary,
                  }}
                >
                  {bonusTextAndColor.text}
                </Text2>
              </AnimatedPressable>
            )}
            {value &&
              !bonusTextAndColor &&
              !isStableCoin &&
              (isNoChange || isPositiveChange || isNegativeChange) && (
                <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  {isNoChange && (
                    <Triangle
                      size={6}
                      color={t.colors.text.tertiary}
                      fill={t.colors.text.tertiary}
                    />
                  )}
                  {isPositiveChange && (
                    <Triangle
                      size={6}
                      color={green || t.colors.text.success}
                      fill={green || t.colors.text.success}
                    />
                  )}
                  {isNegativeChange && (
                    // Note - on Web, transforming the triangle directly will cause it to disappear
                    <View style={{ transform: [{ rotate: '180deg' }] }}>
                      <Triangle
                        size={6}
                        color={t.colors.red450}
                        fill={t.colors.red450}
                      />
                    </View>
                  )}
                  <Text2
                    size="sm"
                    weight="medium"
                    style={
                      isPositiveChange
                        ? { color: green || t.colors.text.success }
                        : isNegativeChange
                          ? { color: t.colors.red450 }
                          : { color: t.colors.text.secondary }
                    }
                    align="right"
                  >
                    {formattedPriceChange}
                  </Text2>
                </View>
              )}
          </View>
        </View>
        {right}
      </AnimatedPressable>
      {showBonusStats && bonuses?.length && (
        <DepositBonusStatsBottomSheet
          ref={bonusStatsRef}
          tokenTicker={token.ticker || 'Token'}
          tokenBalance={ownedValue || 0}
          tokenBonus={bonuses.find((bonus) => bonus.type === 'deposit')!}
          tokenImageUrl={token.imageUrl}
          onDismiss={handleBonusStatsDismiss}
        />
      )}
    </>
  );
}, areTokenListItemPropsEqual);

export function TokenListItemPlaceholder({
  hideValue = false,
  avatarSize = 40,
  gap = 8,
  size,
}: {
  hideValue?: boolean;
  avatarSize?: number;
  gap?: number;
  size?: 'sm' | 'xs';
}) {
  const t = useTheme();

  return (
    <View style={[t.wFull, t.flexRow, t.itemsCenter, { gap: 8 }, t.p3]}>
      <SkeletonPlaceholder
        style={[{ width: avatarSize, height: avatarSize }, t.roundedFull]}
      />
      <View style={[t.flex1, t.flexRow, t.justifyBetween, { gap }]}>
        <View style={[{ gap: 8 }, t.itemsStart]}>
          <TextPlaceholder width={74} size={size} />
          <TextPlaceholder width={74} size={size} />
        </View>
        {!hideValue && (
          <View>
            <TextPlaceholder width={74} />
          </View>
        )}
      </View>
    </View>
  );
}
