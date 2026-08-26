import { AnimatedPressable } from 'farcaster-expo';
import { Search } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '~/contexts/ThemeProvider';

import {
  SEARCH_ICON_BUTTON_SIZE,
  SEARCH_ICON_HEADER_SIZE,
  SEARCH_ICON_RIGHT_OFFSET,
  SEARCH_PRESSABLE_Z_INDEX,
} from './ZIndexLookup';

type PulseFloatingSearchButtonProps = {
  searchQuery: string | null;
  onOpen: () => void;
  shouldAutoOpen?: boolean;
  onAutoOpenHandled?: () => void;
};

function FloatingSearchPressable({
  searchQuery,
  onOpen,
  shouldAutoOpen,
  onAutoOpenHandled,
}: PulseFloatingSearchButtonProps) {
  const t = useTheme();
  const isExpanded = searchQuery !== null;

  const visibilityAnimation = useSharedValue(1);

  useEffect(() => {
    if (isExpanded) {
      visibilityAnimation.set(withTiming(0, { duration: 150 }));
      Keyboard.dismiss();
    } else {
      visibilityAnimation.set(withTiming(1, { duration: 200 }));
    }
  }, [isExpanded, visibilityAnimation]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visibilityAnimation.value,
    pointerEvents: visibilityAnimation.value > 0.5 ? 'auto' : 'none',
  }));

  const handlePress = useCallback(() => {
    onOpen();
  }, [onOpen]);

  useEffect(() => {
    if (!shouldAutoOpen) return;
    onOpen();
    onAutoOpenHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoOpen]);

  const { top: insetTop } = useSafeAreaInsets();
  const topBarHeight = 48;
  const topOffset = insetTop + (topBarHeight - 36) / 2;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: topOffset,
          right: SEARCH_ICON_RIGHT_OFFSET,
          zIndex: SEARCH_PRESSABLE_Z_INDEX,
          width: SEARCH_ICON_BUTTON_SIZE,
          height: SEARCH_ICON_BUTTON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerAnimatedStyle,
      ]}
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[
          {
            width: SEARCH_ICON_BUTTON_SIZE,
            height: SEARCH_ICON_BUTTON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 0,
          },
        ]}
      >
        <Search size={SEARCH_ICON_HEADER_SIZE} color={t.colors.text.primary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export { FloatingSearchPressable };
