import { useDrawerProgress } from '@react-navigation/drawer';
import {
  topBarHeight,
  useTopBar as useTopBarBase,
  UseTopBarOptions,
} from 'farcaster-expo';
import * as React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Avatar } from '~/components/Avatar';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useOpenDrawer } from '~/hooks/navigation/useOpenDrawer';

const avatarDiameter = 30;

const DrawerToggleAvatar = () => {
  const currentUser = useCurrentUser_UNSAFE();
  const openDrawer = useOpenDrawer();

  return (
    <Pressable
      hitSlop={hitSlop}
      onPress={() => {
        openDrawer();
      }}
    >
      <Avatar
        pfpUrl={currentUser.pfp?.url}
        diameter={avatarDiameter}
        border={false}
      />
    </Pressable>
  );
};

const useTopBar = (options: UseTopBarOptions) => {
  const progress = useDrawerProgress();
  const t = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      1 - progress.value,
      [0, 0.5],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return { opacity };
  });

  const baseOptions = React.useMemo(
    () => ({
      ...options,
      leftIcon: options.leftIcon ?? (
        <Animated.View
          style={[animatedStyle, t.absolute, t.left0, t.hFull, t.justifyCenter]}
        >
          <DrawerToggleAvatar />
        </Animated.View>
      ),
    }),
    [options, animatedStyle, t.absolute, t.hFull, t.justifyCenter, t.left0],
  );

  return useTopBarBase(baseOptions);
};

export { DrawerToggleAvatar, topBarHeight, useTopBar };
