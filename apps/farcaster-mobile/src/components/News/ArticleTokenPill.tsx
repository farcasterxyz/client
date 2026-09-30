import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOnchainToken } from 'farcaster-client-data';
import {
  AnimatedPressable,
  Text2,
  TokenIcon,
  useHaptics,
  useTheme,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

export function TokenPill({
  token,
  hidePriceChange,
}: {
  token: ApiOnchainToken;
  hidePriceChange: boolean;
}) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const formattedPriceChange = React.useMemo(() => {
    const priceChange = token.priceChangePct?.h6;
    if (!priceChange || Math.abs(priceChange) >= 10_000) {
      return '';
    }

    const sign = priceChange > 0 ? '+' : '';
    return `${sign}${priceChange.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }, [token.priceChangePct?.h6]);

  const isPositiveChange =
    token.priceChangePct?.h6 !== undefined &&
    token.priceChangePct?.h6 > 0 &&
    token.priceChangePct?.h6 < 10_000;

  const push = usePush();

  const { triggerImpactAsync } = useHaptics();

  const onTokenPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressArticleToken, {
      ca: token.ca,
      chain: token.chain,
    });

    triggerImpactAsync();

    push('Token', { ca: token.ca, chain: token.chain, via: 'article' });
  }, [push, token.ca, token.chain, trackEvent, triggerImpactAsync]);

  const pressableStyle = React.useMemo(
    () => [
      t.selfStart,
      t.backgrounds.tertiary,
      t.pX2,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      { borderRadius: 16, gap: 8, paddingVertical: 6 },
    ],
    [
      t.backgrounds.tertiary,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.pX2,
      t.selfStart,
    ],
  );

  return (
    <AnimatedPressable style={pressableStyle} onPress={onTokenPress}>
      <View style={[t.flexNone]}>
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={16}
          chain={undefined}
          symbol={token.symbol}
          features={token.features}
          imageBordered={false}
        />
      </View>
      <View style={[t.flex]}>
        <Text2 size="sm" weight="medium" numberOfLines={1}>
          {token.symbol}
        </Text2>
      </View>
      {!hidePriceChange && (
        <View style={[t.flexNone]}>
          <Text2
            size="sm"
            color={isPositiveChange ? 'success' : 'secondary'}
            weight="medium"
            align="right"
          >
            {formattedPriceChange}
          </Text2>
        </View>
      )}
    </AnimatedPressable>
  );
}
