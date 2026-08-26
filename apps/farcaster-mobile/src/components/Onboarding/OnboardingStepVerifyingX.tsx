import { useIsFocused } from '@react-navigation/native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import React from 'react';
import { Dimensions, Platform, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';
import { useHaptics } from '~/hooks/useHaptics';

import { trackOnboardingError } from './Onboarding';
import { useOnboardingStateForOnboarding } from './StateProvider';
import { useOnboardingSteps } from './StepsProvider';

const { width, height } = Dimensions.get('window');
const dotRadius = 4;
const spacing = 14;
const centerX = width / 2;
const centerY = height - 160;

function OnboardingStepVerifyingX() {
  const { triggerSuccessNotificationAsync, triggerImpactAsync } = useHaptics();
  const isFocused = useIsFocused();

  const { refresh } = useOnboardingStateForOnboarding();

  const [, dispatch] = useOnboardingSteps();

  const t = useTheme();

  // Swing oscillates continuously between 0 and 1.
  const swing = useSharedValue(0);
  const startAnimation = React.useCallback(() => {
    swing.value = withRepeat(
      withTiming(1, { duration: 1e3, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [swing]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimation(swing);
    swing.value = 0;
  }, [swing]);

  useAnimationPauseOnBackground({
    enabled: isFocused,
    startAnimation,
    stopAnimation,
  });

  // Outer circles (left & right): opacity goes from 1 → 0.3 and vertical offset from -4 → 4.
  const outerOpacity = useDerivedValue(() => 1 - swing.value * 0.7);
  const leftCircleY = useDerivedValue(() => centerY + (-4 + swing.value * 8));

  // Middle circle: opacity goes from 0.3 → 1 and vertical offset from 4 → -4.
  const middleOpacity = useDerivedValue(() => 0.3 + swing.value * 0.7);
  const midCircleY = useDerivedValue(() => centerY + (4 - swing.value * 8));

  const intervalRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerEligible = React.useCallback(async () => {
    await refresh();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (Platform.OS === 'ios') {
      triggerSuccessNotificationAsync();
    } else {
      triggerImpactAsync();
    }

    dispatch({
      type: 'SetStep',
      step: 'ChooseUsername',
      direction: 'forwards',
    });
  }, [dispatch, refresh, triggerImpactAsync, triggerSuccessNotificationAsync]);

  const triggerNotEligible = React.useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    dispatch({
      type: 'SetTwitterVerifcationError',
      error: 'not_eligible',
    });
    dispatch({
      type: 'SetStep',
      step: 'VerifyWithX',
      direction: 'backwards',
    });
  }, [dispatch]);

  const checkTwitterProfile = React.useCallback(async () => {
    try {
      const refreshedOnboardingState = await refresh();
      if (
        typeof refreshedOnboardingState.result.state.twitterProfile !==
        'undefined'
      ) {
        if (refreshedOnboardingState.result.state.twitterProfile.fcVerified) {
          await triggerEligible();
        } else {
          await triggerNotEligible();
        }
      }
    } catch (e) {
      trackOnboardingError(e, 'verifying_x');
    }
  }, [refresh, triggerEligible, triggerNotEligible]);

  React.useEffect(() => {
    intervalRef.current = setInterval(checkTwitterProfile, 3e3);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkTwitterProfile]);

  const { bottom } = useSafeAreaInsets();

  const paddingBottom = React.useMemo(() => {
    return bottom + sizes.s4;
  }, [bottom]);

  return (
    <View style={[t.flex1, t.relative]}>
      <Canvas style={[t.flex1]}>
        <Circle
          cx={centerX - spacing}
          cy={leftCircleY}
          r={dotRadius}
          color={t.colors.text.primary}
          opacity={outerOpacity}
        />
        <Circle
          cx={centerX}
          cy={midCircleY}
          r={dotRadius}
          color={t.colors.text.primary}
          opacity={middleOpacity}
        />
        <Circle
          cx={centerX + spacing}
          cy={leftCircleY}
          r={dotRadius}
          color={t.colors.text.primary}
          opacity={outerOpacity}
        />
      </Canvas>
      <Text2
        size="base"
        color="secondary"
        weight="semibold"
        style={[
          t.wFull,
          t.textCenter,
          t.absolute,
          t.bottom0,
          { paddingBottom },
        ]}
      >
        Verifying X
      </Text2>
    </View>
  );
}

export { OnboardingStepVerifyingX };
