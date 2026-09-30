import { formatPrice, formatTokenStat } from 'farcaster-client-hooks';
import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../../../contexts/ThemeContext';
import { AnimatedPriceDisplay, TextPlaceholder } from '../../../design-system';
import { Text2, TextSize } from '../../../design-system/Text';
import { estimateMarketCapAtPrice, getCanonicalMarketCap } from '../mcap';
import { useTokenChart } from './TokenChartProvider';
import { TouchPoint } from './utils';

export const TokenChartHeader = memo(() => {
  const t = useTheme();
  const { touchPoint, lineChart, token } = useTokenChart();

  const [value, setValue] = React.useState<{
    price: number | null;
    marketCap: number | null;
    priceChangePct: number | null;
    volume: number | null;
    touched: boolean;
  }>({
    price: token?.priceUsd ? parseFloat(token.priceUsd) : null,
    marketCap: token?.marketCap ?? token?.fdv ?? null,
    priceChangePct: token?.priceChangePct?.h24 ?? null,
    volume: token?.volume?.h24 ?? null,
    touched: false,
  });

  const updateHeaderValues = React.useCallback(
    (touchPoint: TouchPoint | null) => {
      if (!token) {
        return;
      }

      const tokenPrice = token.priceUsd ? parseFloat(token.priceUsd) : 0;

      let firstPrice = tokenPrice;
      let latestPrice = tokenPrice;

      if (lineChart.length > 0) {
        if (lineChart[0].price > 0) {
          firstPrice = lineChart[0].price;
        } else {
          const firstPoint = lineChart.find((p) => p.price > 0);
          if (firstPoint) {
            firstPrice = firstPoint.price;
          }
        }
        if (lineChart[lineChart.length - 1].price > 0) {
          latestPrice = lineChart[lineChart.length - 1].price;
        } else {
          for (let i = lineChart.length - 1; i >= 0; i--) {
            const latestPoint = lineChart[i];
            if (latestPoint?.price > 0) {
              latestPrice = latestPoint.price;
              break;
            }
          }
        }
      }

      const denominator = firstPrice > 0 ? firstPrice : tokenPrice;
      const delta =
        denominator && denominator > 0
          ? (latestPrice - denominator) / denominator
          : 0;
      const referencePrice =
        tokenPrice && tokenPrice > 0 ? tokenPrice : latestPrice;
      const baseMarketCap = getCanonicalMarketCap({
        marketCap: token.marketCap ?? token.fdv,
        circulatingSupply: token.circulatingSupply,
        effectivePriceUsd: referencePrice,
      });

      if (!touchPoint) {
        setValue({
          price: tokenPrice || latestPrice || firstPrice,
          marketCap: baseMarketCap ?? 0,
          priceChangePct: delta * 100,
          volume: lineChart.reduce((acc, point) => acc + point.volume, 0),
          touched: false,
        });
      } else if (touchPoint.price > 0) {
        const currentPrice = touchPoint.price;
        const currentVolume = touchPoint.volume;
        const touchedDelta =
          denominator && denominator > 0
            ? (currentPrice - denominator) / denominator
            : 0;
        const touchedMarketCap = estimateMarketCapAtPrice({
          currentMarketCap: baseMarketCap,
          currentPriceUsd: referencePrice,
          targetPriceUsd: currentPrice,
        });

        setValue({
          price: currentPrice,
          marketCap: touchedMarketCap ?? baseMarketCap ?? 0,
          priceChangePct: touchedDelta * 100,
          volume: currentVolume,
          touched: true,
        });
      } else {
        setValue({
          price: 0,
          marketCap: 0,
          priceChangePct: 0,
          volume: 0,
          touched: false,
        });
      }
    },
    [lineChart, token],
  );

  useAnimatedReaction(
    () => touchPoint.value,
    (newValue, prevValue) => {
      if (newValue?.timestamp !== prevValue?.timestamp) {
        runOnJS(updateHeaderValues)(newValue);
      }
    },
    // We need to keep updateHeaderValues in the dependency array to ensure the updated function is always used
    [touchPoint, updateHeaderValues],
  );

  React.useEffect(() => {
    if (!token) {
      return;
    }

    if (lineChart.length === 0) {
      setValue({
        price: token.priceUsd ? parseFloat(token.priceUsd) : null,
        marketCap: token.marketCap ?? token.fdv ?? null,
        priceChangePct: token.priceChangePct?.h24 ?? null,
        volume: token.volume?.h24 ?? null,
        touched: false,
      });
    } else if (!value.touched) {
      updateHeaderValues(null);
    }
  }, [token, lineChart, updateHeaderValues, value.touched]);

  return (
    <View style={[t.pX3, t.flex1, t.flexRow, t.itemsCenter, t.justifyBetween]}>
      <View>
        {value.price !== null ? (
          value.touched ? (
            <TokenChartHeaderPrice price={value.price} />
          ) : (
            <AnimatedPriceDisplay price={value.price} />
          )
        ) : (
          <TextPlaceholder width={100} size="4xl" style={{ marginTop: 12 }} />
        )}
        {value.priceChangePct !== null ? (
          <TokenChartHeaderPriceChangePct
            priceChangePct={value.priceChangePct}
          />
        ) : (
          <TextPlaceholder width={50} size="sm" style={{ marginTop: 2 }} />
        )}
      </View>
      {value.marketCap !== null && (
        <TokenChartHeaderMarketCapAndVolume
          marketCap={value.marketCap}
          volume={value.volume}
        />
      )}
      <TokenChartCandlestickPressedOverlay />
    </View>
  );
});

function TokenChartHeaderMarketCapAndVolume({
  marketCap,
  volume,
}: {
  marketCap: number;
  volume: number | null;
}) {
  const t = useTheme();

  return (
    <View style={[t.itemsEnd, { gap: 4 }]}>
      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        <Text2 size="xs" weight="semibold" color="secondary">
          MCAP
        </Text2>
        <Text2 weight="semibold" color={marketCap ? 'primary' : 'quaternary'}>
          {marketCap ? formatTokenStat(marketCap) : '$0'}
        </Text2>
      </View>
      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        <Text2 size="xs" weight="semibold" color="secondary">
          VOL
        </Text2>
        <Text2 weight="semibold" color={volume ? 'primary' : 'quaternary'}>
          {volume ? formatTokenStat(volume) : '$0'}
        </Text2>
      </View>
    </View>
  );
}

function TokenChartHeaderPrice({ price }: { price: number }) {
  const t = useTheme();

  const { numberOfZeros, remainingDigits, dollars, cents } =
    React.useMemo(() => {
      const priceToUse = price ?? 0;

      // Match AnimatedPriceDisplay behavior: use toLocaleString for decimal extraction
      const decimal =
        priceToUse
          .toLocaleString('en-US', {
            useGrouping: false,
            maximumSignificantDigits: 21,
          })
          .split('.')[1] || '';

      let numberOfZeros = 0;
      let remainingDigits = '';
      if (priceToUse < 0.0001) {
        for (const char of decimal) {
          if (char === '0' && remainingDigits === '') {
            numberOfZeros++;
          } else {
            remainingDigits += char;
          }
        }
      }

      // For regular prices, format with same logic as AnimatedPriceDisplay
      const formattedPrice = priceToUse.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: priceToUse < 1 ? 6 : 2,
      });
      const [dollarsPart, centsPart = ''] = formattedPrice.split('.');

      return {
        numberOfZeros,
        remainingDigits: remainingDigits.slice(0, 8 - numberOfZeros).split(''),
        dollars: dollarsPart,
        cents: centsPart,
      };
    }, [price]);

  return (
    <View style={[t.flexRow, t.itemsCenter, { paddingTop: 12 }]}>
      <Text2
        size="2xl"
        weight="medium"
        adjustsFontSizeToFit
        numberOfLines={1}
        lineHeight="xl"
        style={{ transform: [{ translateY: -3 }] }}
      >
        $
      </Text2>
      <Text2
        size="4xl"
        weight="semibold"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {dollars}
      </Text2>
      {numberOfZeros > 3 ? (
        <>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            .
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            0
          </Text2>
          <Text2
            size="xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ paddingTop: 12 }}
          >
            {numberOfZeros}
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {remainingDigits}
          </Text2>
        </>
      ) : (
        <>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            .
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {cents}
          </Text2>
        </>
      )}
    </View>
  );
}

function TokenChartHeaderPriceChangePct({
  priceChangePct,
}: {
  priceChangePct: number;
}) {
  const t = useTheme();

  const change = React.useMemo(() => {
    if (!priceChangePct) {
      return;
    }

    if (priceChangePct > 0) {
      return {
        icon: (
          <Svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <Path
              d="M6.79291 2.3333C6.71233 2.19439 6.59667 2.07908 6.45752 1.99893C6.31836 1.91878 6.16059 1.87659 6 1.87659C5.83941 1.87659 5.68163 1.91878 5.54248 1.99893C5.40332 2.07908 5.28766 2.19439 5.20708 2.3333L1.54041 8.74996C1.46 8.88924 1.41764 9.04723 1.4176 9.20806C1.41756 9.36889 1.45983 9.5269 1.54018 9.66622C1.62052 9.80555 1.73611 9.92128 1.87533 10.0018C2.01455 10.0823 2.1725 10.1248 2.33333 10.125H9.66666C9.82749 10.1248 9.98545 10.0823 10.1247 10.0018C10.2639 9.92128 10.3795 9.80555 10.4598 9.66622C10.5402 9.5269 10.5824 9.36889 10.5824 9.20806C10.5823 9.04723 10.54 8.88924 10.4596 8.74996L6.79291 2.3333Z"
              fill={t.colors.green450}
              stroke={t.colors.green450}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
        label: `${Math.abs(priceChangePct).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}%`,
        color: t.colors.green450,
      };
    }

    return {
      icon: (
        <Svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <Path
            d="M5.20709 9.6667C5.28767 9.80561 5.40333 9.92092 5.54248 10.0011C5.68164 10.0812 5.83941 10.1234 6 10.1234C6.16059 10.1234 6.31837 10.0812 6.45752 10.0011C6.59668 9.92092 6.71234 9.80561 6.79292 9.6667L10.4596 3.25004C10.54 3.11076 10.5824 2.95277 10.5824 2.79194C10.5824 2.63111 10.5402 2.4731 10.4598 2.33378C10.3795 2.19445 10.2639 2.07872 10.1247 1.9982C9.98545 1.91768 9.8275 1.8752 9.66667 1.87504L2.33334 1.87504C2.17251 1.8752 2.01455 1.91768 1.87533 1.9982C1.73611 2.07872 1.62053 2.19445 1.54019 2.33378C1.45984 2.4731 1.41757 2.63111 1.41761 2.79194C1.41765 2.95277 1.46001 3.11075 1.54042 3.25004L5.20709 9.6667Z"
            fill={t.colors.red450}
            stroke={t.colors.red450}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      label: `-${Math.abs(priceChangePct).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
      color: t.colors.red450,
    };
  }, [priceChangePct, t.colors.red450, t.colors.green450]);

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      {change?.icon}
      <Text2 size="sm" weight="semibold" style={{ color: change?.color }}>
        {change?.label || ' '}
      </Text2>
    </View>
  );
}

function OverlayPrice({
  price,
  color,
  size = 'xs',
  tabularNums = false,
  maxFormattedLength,
  maxRemainingDigitsLength,
}: {
  price: number;
  color?: string;
  size?: TextSize;
  tabularNums?: boolean;
  maxFormattedLength?: number;
  maxRemainingDigitsLength?: number;
}) {
  const t = useTheme();

  const { numberOfZeros, remainingDigits, formattedPrice } =
    React.useMemo(() => {
      const [dollars, cents = ''] = formatPrice(price ?? 0, {
        showDollarSign: false,
      }).split('.');

      let numberOfZeros = 0;
      let remainingDigits = '';
      if (price < 0.0001) {
        for (const char of cents) {
          if (char === '0' && remainingDigits === '') {
            numberOfZeros++;
          } else {
            remainingDigits += char;
          }
        }
      }

      // Limit remaining digits
      remainingDigits = remainingDigits.slice(0, 8 - numberOfZeros);

      // Pad remaining digits for subscript format
      if (maxRemainingDigitsLength !== undefined && numberOfZeros > 3) {
        while (remainingDigits.length < maxRemainingDigitsLength) {
          remainingDigits += '0';
        }
      }

      // Format price normally
      let formattedPrice = formatPrice(price);

      // Pad with zeros to match longest OCHL value (for regular format)
      if (maxFormattedLength !== undefined && numberOfZeros <= 3) {
        while (formattedPrice.length < maxFormattedLength) {
          formattedPrice += '0';
        }
      }

      return {
        numberOfZeros,
        remainingDigits,
        formattedPrice,
        dollars,
      };
    }, [price, maxFormattedLength, maxRemainingDigitsLength]);

  if (numberOfZeros <= 3) {
    return (
      <Text2
        weight="semibold"
        size={size}
        style={{
          ...(tabularNums && { fontVariant: ['tabular-nums'] }),
          ...(color && { color }),
        }}
      >
        {formattedPrice}
      </Text2>
    );
  }

  return (
    <View style={[t.flexRow, t.itemsCenter]}>
      <Text2
        weight="semibold"
        size={size}
        style={{
          ...(tabularNums && { fontVariant: ['tabular-nums'] }),
          ...(color && { color }),
        }}
      >
        $0.0
      </Text2>
      <Text2
        size="2xs"
        weight="semibold"
        style={[
          { transform: [{ translateY: size === 'lg' ? 5 : 3 }] },
          color ? { color } : undefined,
        ]}
      >
        {numberOfZeros}
      </Text2>
      <Text2
        size={size}
        weight="semibold"
        style={{
          ...(tabularNums && { fontVariant: ['tabular-nums'] }),
          ...(color && { color }),
        }}
      >
        {remainingDigits}
      </Text2>
    </View>
  );
}

function TokenChartCandlestickPressedOverlay() {
  const t = useTheme();
  const { activeCandleData } = useTokenChart();

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeCandleData.value !== null;

    return {
      opacity: withTiming(isActive ? 1 : 0, {
        duration: 100,
        easing: Easing.out(Easing.ease),
      }),
    };
  });

  const [displayData, setDisplayData] = React.useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
  } | null>(null);

  useAnimatedReaction(
    () => activeCandleData.value,
    (candle) => {
      if (candle) {
        runOnJS(setDisplayData)({
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          timestamp: candle.timestamp,
        });
      } else {
        runOnJS(setDisplayData)(null);
      }
    },
  );

  const priceChangePct = displayData
    ? ((displayData.close - displayData.open) / displayData.open) * 100
    : 0;
  const isPositive = displayData && displayData.close >= displayData.open;

  const formatVolume = (volume: number) => {
    if (volume === 0) return 'None';
    // For values under 1000, show with 2 decimal places
    if (volume < 1000) {
      return `$${volume.toFixed(2)}`;
    }
    // For larger values, use the standard formatter
    return formatTokenStat(volume);
  };

  // Calculate max length for both regular and subscript formats
  const { maxFormattedLength, maxRemainingDigitsLength } = React.useMemo(() => {
    if (!displayData)
      return { maxFormattedLength: 0, maxRemainingDigitsLength: 0 };

    const values = [
      displayData.open,
      displayData.close,
      displayData.high,
      displayData.low,
    ];

    // For regular prices (no subscript)
    const maxFormattedLength = Math.max(
      ...values.map((v) => {
        const formatted = formatPrice(v);
        return formatted.length;
      }),
    );

    // For subscript prices, track remaining digits length (after truncation)
    const maxRemainingDigitsLength = Math.max(
      ...values.map((v) => {
        const decimal = v.toString().split('.')[1] || '';
        let numberOfZeros = 0;
        let remainingDigits = '';

        if (v < 0.0001) {
          for (const char of decimal) {
            if (char === '0' && remainingDigits === '') {
              numberOfZeros++;
            } else {
              remainingDigits += char;
            }
          }
          // Apply the same truncation logic as in OverlayPrice
          remainingDigits = remainingDigits.slice(0, 8 - numberOfZeros);
          return remainingDigits.length;
        }
        return 0;
      }),
    );

    return { maxFormattedLength, maxRemainingDigitsLength };
  }, [displayData]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -14,
          right: 0,
          left: 0,
          bottom: 0,
          paddingHorizontal: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: t.colors.background.primary,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {displayData ? (
            <OverlayPrice price={displayData.close} size="lg" />
          ) : (
            <Text2 weight="semibold" size="xs">
              $0
            </Text2>
          )}
          <View>
            <TokenChartHeaderPriceChangePct priceChangePct={priceChangePct} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text2 color="secondary" size="xs">
            Vol:
          </Text2>
          <Text2
            color="secondary"
            size="xs"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {displayData ? formatVolume(displayData.volume) : 'None'}
          </Text2>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: -18,
            left: 0,
            flex: 1,
            minWidth: 160, // Keep this to prevent timestamp splitting into 2 lines when the element is narrow
          }}
        >
          <Text2
            size="xs"
            color="tertiary"
            style={{
              fontVariant: ['tabular-nums'],
            }}
          >
            {displayData
              ? new Date(displayData.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : ''}
          </Text2>
        </View>
      </View>
      <View
        style={[t.flexRow, t.itemsCenter, t.justifyEnd, { gap: 12, flex: 1 }]}
      >
        <View style={{ gap: 1 }}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
            <Text2
              size="xs"
              color="secondary"
              align="center"
              style={{ width: 16 }}
            >
              O:
            </Text2>
            {displayData ? (
              <OverlayPrice
                price={displayData.open}
                size="xs"
                tabularNums
                maxFormattedLength={maxFormattedLength}
                maxRemainingDigitsLength={maxRemainingDigitsLength}
              />
            ) : (
              <Text2 size="xs">$0</Text2>
            )}
          </View>
          <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
            <Text2
              size="xs"
              color="secondary"
              align="center"
              style={{ width: 16 }}
            >
              C:
            </Text2>
            {displayData ? (
              <OverlayPrice
                price={displayData.close}
                color={isPositive ? t.colors.green450 : t.colors.red450}
                size="xs"
                tabularNums
                maxFormattedLength={maxFormattedLength}
                maxRemainingDigitsLength={maxRemainingDigitsLength}
              />
            ) : (
              <Text2 size="xs">$0</Text2>
            )}
          </View>
        </View>
        <View style={{ gap: 1 }}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
            <Text2
              size="xs"
              color="secondary"
              align="center"
              style={{ width: 16 }}
            >
              H:
            </Text2>
            {displayData ? (
              <OverlayPrice
                price={displayData.high}
                size="xs"
                tabularNums
                maxFormattedLength={maxFormattedLength}
                maxRemainingDigitsLength={maxRemainingDigitsLength}
              />
            ) : (
              <Text2 size="xs">$0</Text2>
            )}
          </View>
          <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
            <Text2
              size="xs"
              color="secondary"
              align="center"
              style={{ width: 16 }}
            >
              L:
            </Text2>
            {displayData ? (
              <OverlayPrice
                price={displayData.low}
                size="xs"
                tabularNums
                maxFormattedLength={maxFormattedLength}
                maxRemainingDigitsLength={maxRemainingDigitsLength}
              />
            ) : (
              <Text2 size="xs">$0</Text2>
            )}
          </View>
        </View>
      </View>
      {!displayData && <View />}
    </Animated.View>
  );
}

TokenChartHeader.displayName = 'TokenChartHeader';
