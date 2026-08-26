import { AnalyticsEvent } from 'farcaster-analytics';
import { formatAmount } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import { formatUnits } from 'viem';

import { useSharedTelemetry, useTheme } from '../../../../contexts';
import { useHaptics } from '../../../../hooks';
import { AnimatedPressable, Text2 } from '../../../design-system';
import { useSwapTokens } from './SwapTokensProvider';

export function SwapTokensQuickSelect() {
  const t = useTheme();
  const {
    sellToken,
    sellTokenBalance,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    setSellAmount,
    isFetching,
    usdcDenominatedSwaps,
    setPercentageOfSellAmountChosen,
    assetPickerType,
  } = useSwapTokens();
  const { trackEvent } = useSharedTelemetry();

  const { triggerImpactAsync } = useHaptics();

  const onSelectPct = React.useCallback(
    ({ pct }: { pct: number }) => {
      if (!sellToken || !sellTokenBalance || isFetching) {
        return;
      }

      triggerImpactAsync();
      trackEvent(AnalyticsEvent.PressQuickSwapSelectorPct, { pct });
      if (usdcDenominatedSwaps) {
        if (!sellTokenUsdBalance) {
          return;
        }
        setPercentageOfSellAmountChosen(pct);
        setSellAmount(
          formatAmount((sellTokenUsdBalance * pct) / 100, {
            priceUsd: sellTokenPriceUsd ?? 0,
            useGrouping: false,
          }).replace(/,/g, '.'),
        );
        return;
      }

      const sellAmount = BigInt(sellTokenBalance);
      let newAmount = (sellAmount * BigInt(pct)) / BigInt(100);

      if (pct === 100) {
        newAmount = newAmount > sellAmount ? newAmount : sellAmount;
      }

      const formattedAmount = formatUnits(newAmount, sellToken.decimals ?? 18);

      if (pct === 100) {
        setSellAmount(formattedAmount);
      } else {
        setSellAmount(
          formatAmount(parseFloat(formattedAmount), {
            priceUsd: sellTokenPriceUsd ?? 0,
            useGrouping: false,
          }).replace(/,/g, '.'),
        );
      }
    },
    [
      trackEvent,
      triggerImpactAsync,
      setSellAmount,
      sellToken,
      sellTokenBalance,
      isFetching,
      sellTokenUsdBalance,
      sellTokenPriceUsd,
      usdcDenominatedSwaps,
      setPercentageOfSellAmountChosen,
    ],
  );

  // Used for buy with CC
  const onSelectAmount = React.useCallback(
    (amount: string) => {
      if (!sellToken || !sellTokenBalance || isFetching) {
        return;
      }
      setSellAmount(amount);
    },
    [sellToken, sellTokenBalance, isFetching, setSellAmount],
  );

  if (!sellToken) {
    return null;
  }

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.wFull,
        t.justifyBetween,
        { gap: 8, zIndex: 1 },
      ]}
    >
      {[10, 25, 50, 100].map((pct) => (
        <AnimatedPressable
          key={pct}
          style={[t.flex1]}
          onPress={
            assetPickerType === 'crypto'
              ? () => onSelectPct({ pct })
              : () => onSelectAmount(pct.toString())
          }
        >
          <View
            style={[
              t.flex1,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.roundedFull,
              t.dark ? t.backgrounds.secondary : t.backgrounds.brandLight,
              { paddingVertical: 6 },
            ]}
          >
            <Text2 weight="semibold" color={'brand'}>
              {assetPickerType === 'crypto'
                ? pct === 100
                  ? 'Max'
                  : `${pct}%`
                : pct.toString()}
            </Text2>
          </View>
        </AnimatedPressable>
      ))}
    </View>
  );
}
