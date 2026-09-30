import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeInUp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../../contexts';
import { Text2 } from '../../../design-system';

const initialOpacity = 0.2;
const initialScale = 0.2;

const AnimatedDigit: React.FC<{ char: string }> = ({ char }) => {
  const duration = 180;
  const opacity = useSharedValue(initialOpacity);
  const scale = useSharedValue(initialScale);
  const prevChar = useRef(char);

  const runAnim = React.useCallback(() => {
    // reset
    opacity.value = initialOpacity;
    scale.value = initialScale;

    // fade in
    opacity.value = withTiming(1, { duration });

    // grow in
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.4,
    });
  }, [duration, opacity, scale]);

  // on mount
  useEffect(() => {
    runAnim();
  }, [runAnim]);

  // when this specific digit changes
  useEffect(() => {
    if (prevChar.current !== char) {
      prevChar.current = char;
      runAnim();
    }
  }, [char, runAnim]);

  return (
    <Text2 size="8xl" weight="semibold">
      {char}
    </Text2>
  );
};

const EasterEggMap: Record<string, string> = {
  '6969': 'Nice',
  '42069': 'Nice',
  '1111': 'Make a wish',
  '42042': 'Burn it',
};

export function SwapTokensLargeValueDisplay({
  value,
  iconDisplay,
  showDollarSign = true,
}: {
  value: string;
  iconDisplay?: React.ReactNode;
  showDollarSign?: boolean;
}) {
  const t = useTheme();
  const dollarChars = useMemo(
    () => `${showDollarSign ? '$' : ''}${value ? value : '0'}`.split(''),
    [value, showDollarSign],
  );
  const [eastEasterEgg, setEasterEgg] = useState<string | null>(null);
  const easterEggProgress = useSharedValue(0);

  React.useEffect(() => {
    const cleanedValue = value.replace(/[,.]/g, '');
    const easterEgg = EasterEggMap[cleanedValue];
    if (easterEgg) {
      setEasterEgg(easterEgg);
      easterEggProgress.value = withTiming(
        1,
        { duration: 1000 },
        (finished) => {
          'worklet';
          if (finished) {
            easterEggProgress.value = 0;
            runOnJS(setEasterEgg)(null);
          }
        },
      );
    }
  }, [value, easterEggProgress]);

  const easterEggAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(easterEggProgress.value, [0, 1], [1, 0]),
      transform: [{ translateY: easterEggProgress.value * -50 - 100 }],
    };
  }, [easterEggProgress]);

  return (
    <View
      style={[t.flex1, t.itemsCenter, t.justifyCenter, { padding: 20, gap: 8 }]}
    >
      {eastEasterEgg && (
        <Animated.View
          style={[
            t.absolute,
            t.selfCenter,
            t.selfAuto,
            t.alignCenter,
            t.justifyCenter,
            easterEggAnimatedStyle,
          ]}
        >
          <Text2 size="sm" weight="semibold">
            {eastEasterEgg}
          </Text2>
        </Animated.View>
      )}
      <View style={[t.flex1, t.justifyCenter, t.itemsCenter, t.gap2]}>
        <Text2
          size="8xl"
          weight="semibold"
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          numberOfLines={1}
          style={[t.justifyCenter, t.itemsCenter]}
        >
          {dollarChars.map((char, index) => (
            <AnimatedDigit key={`dollar-${index}-${char}`} char={char} />
          ))}
        </Text2>
        {iconDisplay && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={{
              position: 'absolute',
              marginTop: 80,
            }}
          >
            {iconDisplay}
          </Animated.View>
        )}
      </View>
    </View>
  );
}
