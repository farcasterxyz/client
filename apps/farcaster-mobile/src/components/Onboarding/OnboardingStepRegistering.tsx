import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MILLIS_PER_SECOND, useTelemetry } from 'farcaster-client-hooks';
import { Typography, TypographyHeading } from 'farcaster-expo';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';

import { RUM_ACTIONS } from './Onboarding';

const Loader = ({ size, color }: { size: number; color: string }) => {
  return (
    <Svg width={size} height={size} fill="none">
      <Path
        d="M12 2.5V6.5"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M16.2002 8.30002L19.1002 5.40002"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M18 12.5H22"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M16.2002 16.7L19.1002 19.6"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M12 18.5V22.5"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M4.8999 19.6L7.7999 16.7"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M2 12.5H6"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M4.8999 5.40002L7.7999 8.30002"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  );
};

export function OnboardingStepRegisteringLoading() {
  const t = useTheme();
  const isFocused = useIsFocused();

  const timingValue = useSharedValue(0);
  const startAnimation = React.useCallback(() => {
    timingValue.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [timingValue]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimation(timingValue);
    timingValue.value = 0;
  }, [timingValue]);

  useAnimationPauseOnBackground({
    enabled: isFocused,
    startAnimation,
    stopAnimation,
  });

  const { addAction } = useTelemetry();

  useEffect(() => {
    const frustratingTimer = setTimeout(() => {
      addAction(RUM_ACTIONS.creatingAccountPerceivedStale, {
        duration: 10_000,
      });
    }, 10_000);

    return () => {
      clearTimeout(frustratingTimer);
    };
  }, [addAction]);

  const { bottom } = useSafeAreaInsets();

  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setProgressText('This may take up to a minute. Don’t close the app.');
    }, MILLIS_PER_SECOND * 3);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${timingValue.value * 360}deg` },
      { scale: interpolate(timingValue.value, [0, 1], [0.5, 1.5]) },
    ],
    marginBottom: interpolate(timingValue.value, [0, 1], [8, 16]),
  }));

  return (
    <LinearGradient
      colors={t.dark ? ['#12121240', '#6A3CFF40'] : ['#E3E9FF40', '#6A3CFF40']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        t.backgrounds.default,
        {
          position: 'absolute',
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        },
      ]}
    >
      <View
        style={[
          t.flex1,
          t.itemsCenter,
          t.alignCenter,
          t.justifyCenter,
          { paddingBottom: bottom },
        ]}
      >
        <Animated.View style={[animatedStyle]}>
          <Loader size={24} color={t.colors.text.brand} />
        </Animated.View>
        <TypographyHeading
          label="Large"
          color="primary"
          style={[t.wFull, t.textCenter, t.selfCenter]}
        >
          Creating account
        </TypographyHeading>
        {!!progressText && (
          <Typography
            label="Body/Small"
            color="primary"
            style={[t.wFull, t.textCenter, t.selfCenter]}
          >
            {progressText}
          </Typography>
        )}
      </View>
    </LinearGradient>
  );
}
