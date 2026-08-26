import { ApiOnchainTokenChartAnnotation } from 'farcaster-client-data';
import { formatShorthandAmount } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';

import { useTheme } from '../../../../../contexts/ThemeContext';
import { formatBalance } from '../../../../../utils';
import { Text2 } from '../../../../design-system/Text';
import { colors } from '../utils';

export const TokenCandlestickChartAnnotationLabel = React.memo(
  ({
    symbol,
    activeCandleAnnotations,
    _activeCandleIndex,
  }: {
    symbol: string;
    activeCandleAnnotations: SharedValue<ApiOnchainTokenChartAnnotation[]>;
    _activeCandleIndex: SharedValue<number>;
  }) => {
    const t = useTheme();
    const [annotations, setAnnotations] = React.useState<
      ApiOnchainTokenChartAnnotation[]
    >([]);
    const lastAnnotationCount = React.useRef(0);

    // Sync shared value to React state
    useFrameCallback(() => {
      'worklet';
      const currentCount = activeCandleAnnotations.value.length;
      if (currentCount !== lastAnnotationCount.current) {
        lastAnnotationCount.current = currentCount;
        runOnJS(setAnnotations)([...activeCandleAnnotations.value]);
      }
    });

    const hasAnnotations = useDerivedValue(() => {
      return activeCandleAnnotations.value.length > 0;
    }, [activeCandleAnnotations]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: hasAnnotations.value ? 1 : 0,
        pointerEvents: hasAnnotations.value ? 'auto' : 'none',
        transform: [
          {
            translateY: hasAnnotations.value ? 0 : 10,
          },
        ],
      };
    }, [hasAnnotations]);

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingBottom: 8,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      >
        {annotations.length > 0 && (
          <View
            style={[
              t.backgrounds.secondary,
              t.roundedLg,
              t.pX3,
              t.pY2,
              t.borders.secondary,
              { borderWidth: 1, gap: 8, minWidth: 100, alignItems: 'center' },
            ]}
          >
            {annotations.slice(0, 5).map((annotation, index) => {
              const isSelfSell = annotation.type === 'self-sell';
              const sign = isSelfSell ? '-' : '+';
              const quantity = formatShorthandAmount(annotation.quantity.float);
              const valueUsd = formatBalance(annotation.quantity.valueUsd);

              return (
                <View
                  key={index}
                  style={{ width: '100%', alignItems: 'center' }}
                >
                  <Text2
                    size="xs"
                    weight="semibold"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      color: isSelfSell ? colors.red : colors.green,
                    }}
                  >
                    {sign}
                    {valueUsd}
                  </Text2>
                  <Text2
                    size="2xs"
                    color="tertiary"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    {quantity} {symbol}
                  </Text2>
                </View>
              );
            })}
            {annotations.length > 5 && (
              <Text2
                size="2xs"
                color="tertiary"
                style={{ width: '100%', textAlign: 'center' }}
              >
                + {annotations.length - 5} more
              </Text2>
            )}
          </View>
        )}
      </Animated.View>
    );
  },
);
