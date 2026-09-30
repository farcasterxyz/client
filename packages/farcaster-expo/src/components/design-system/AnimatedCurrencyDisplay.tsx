import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts';
import { Text2 } from './Text';

type AnimatedCurrencyDisplaySize = '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

interface AnimatedDigitProps {
  digit: string;
  size?: AnimatedCurrencyDisplaySize;
  weight?: 'medium' | 'semibold';
  color?: 'primary' | 'tertiary';
  delay?: number;
  enabled?: boolean;
}

function AnimatedDigit({
  digit,
  size = '5xl',
  weight = 'semibold',
  color = 'primary',
  delay = 0,
  enabled = true,
}: AnimatedDigitProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Reset to initial animation state
    translateY.value = -20;
    opacity.value = 0;
    scale.value = 0.8;

    // Animate in with spring for natural motion
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 20,
        stiffness: 180,
        mass: 0.8,
      }),
    );

    // Smooth fade in with bezier easing
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );

    // Subtle scale animation
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      }),
    );
  }, [digit, delay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: [{ translateY: 0 }, { scale: 1 }],
        opacity: 1,
        paddingTop: 12,
      };
    }

    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
      paddingTop: 12,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Text2 size={size} weight={weight} color={color}>
        {digit}
      </Text2>
    </Animated.View>
  );
}

export function AnimatedBalanceDisplay({
  size = '5xl',
  amount,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  decimalsColor = 'tertiary',
  enabled = true,
}: {
  size?: AnimatedCurrencyDisplaySize;
  amount?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  decimalsColor?: 'primary' | 'tertiary';
  enabled?: boolean;
}) {
  const t = useTheme();
  const [animationEnabled, setAnimationEnabled] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    setTimeout(() => {
      setAnimationEnabled(true);
    }, 1000);
  }, [enabled]);

  const { dollars, cents } = useMemo(() => {
    const balance = (amount ?? 0).toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    });
    const [dollars, cents = '00'] = balance.split('.');
    return { dollars, cents };
  }, [amount, minimumFractionDigits, maximumFractionDigits]);

  // Split dollars into individual characters (including commas)
  const dollarChars = useMemo(() => dollars.split(''), [dollars]);
  const centChars = useMemo(() => cents.split(''), [cents]);

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={[t.flexRow, t.itemsStart]}>
        <Text2
          size={
            size === '5xl' || size === '4xl' || size === '3xl' ? '2xl' : 'xl'
          }
          weight="medium"
          lineHeight={
            size === '5xl' || size === '4xl' || size === '3xl' ? 'xl' : 'lg'
          }
          style={{ paddingTop: size === '5xl' ? 12 : 16 }}
        >
          $
        </Text2>
        <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
          {dollarChars.map((char, index) => (
            <AnimatedDigit
              key={`dollar-${index}-${char}`}
              digit={char}
              size={size}
              weight="semibold"
              color="primary"
              delay={index * 30}
              enabled={animationEnabled}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
          <Text2
            size={size}
            weight="semibold"
            color={decimalsColor}
            style={{ paddingTop: 12 }}
          >
            .
          </Text2>
          {centChars.map((char, index) => (
            <AnimatedDigit
              key={`cent-${index}-${char}`}
              digit={char}
              size={size}
              weight="semibold"
              color={decimalsColor}
              delay={(dollarChars.length + index) * 30}
              enabled={animationEnabled}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export const AnimatedPriceDisplay = React.memo(
  ({
    size = '4xl',
    price,
    enabled = true,
  }: {
    size?: AnimatedCurrencyDisplaySize;
    price?: number;
    enabled?: boolean;
  }) => {
    const [animationEnabled, setAnimationEnabled] = React.useState(false);
    const t = useTheme();

    React.useEffect(() => {
      if (!enabled) {
        return;
      }
      setTimeout(() => {
        setAnimationEnabled(true);
      }, 1000);
    }, [enabled]);

    const priceToUse = React.useMemo(() => {
      return price ?? 0;
    }, [price]);

    const { numberOfZeros, remainingDigits } = React.useMemo(() => {
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
      return {
        numberOfZeros,
        remainingDigits: remainingDigits.slice(0, 8 - numberOfZeros).split(''),
      };
    }, [priceToUse]);

    if (numberOfZeros <= 3) {
      return (
        <AnimatedBalanceDisplay
          size={size}
          amount={priceToUse}
          minimumFractionDigits={2}
          maximumFractionDigits={priceToUse < 1 ? 6 : 2}
          decimalsColor="primary"
          enabled={animationEnabled}
        />
      );
    }

    return (
      <View style={{ overflow: 'hidden' }}>
        <View style={[t.flexRow, t.itemsStart]}>
          <Text2
            size={size === '5xl' || size === '4xl' ? '2xl' : 'xl'}
            weight="medium"
            lineHeight={size === '5xl' || size === '4xl' ? 'xl' : 'lg'}
            style={{ paddingTop: size === '5xl' ? 12 : 16 }}
          >
            $
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ paddingTop: 12 }}
          >
            0
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ paddingTop: 12 }}
          >
            .
          </Text2>
          <Text2
            size="4xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ paddingTop: 12 }}
          >
            0
          </Text2>
          <Text2
            size="xl"
            weight="semibold"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ paddingTop: 12, transform: [{ translateY: 13 }] }}
          >
            {numberOfZeros}
          </Text2>
          <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
            {remainingDigits.map((char, index) => (
              <AnimatedDigit
                key={`remaining-${index}-${char}`}
                digit={char}
                size={size}
                weight="semibold"
                color="primary"
                delay={index * 30}
                enabled={animationEnabled}
              />
            ))}
          </View>
        </View>
      </View>
    );
  },
);
