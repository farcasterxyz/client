import { useDrawerProgress } from '@react-navigation/drawer';
import { ScreenTitle } from 'farcaster-expo';
import { FC, memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Avatar } from '~/components/Avatar';
import { HomeHeaderRightButtons } from '~/components/headers/HomeHeaderRightButtons';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useOpenDrawer } from '~/hooks/navigation/useOpenDrawer';

export const avatarDiameter = 30;
const topBarHeight = 48;

type FeedTopBarProps = {
  title?: string;
};

const FeedTopBar: FC<FeedTopBarProps> = memo(({ title }) => {
  const t = useTheme();
  const currentUser = useCurrentUser_UNSAFE();
  const openDrawer = useOpenDrawer();
  const progress = useDrawerProgress();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      1 - progress.value,
      [0, 0.5],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return { opacity };
  });

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.pX4,
        t.wFull,
        { height: topBarHeight },
      ]}
    >
      <Animated.View style={[t.absolute, t.left0, t.pL4, animatedStyle]}>
        <Pressable
          hitSlop={hitSlop}
          onPress={() => {
            openDrawer();
          }}
          style={[t.pR2]}
        >
          <Avatar
            pfpUrl={currentUser.pfp?.url}
            diameter={avatarDiameter}
            border={false}
          />
        </Pressable>
      </Animated.View>
      {title && (
        <View>
          <ScreenTitle title={title} />
        </View>
      )}
      <View style={[t.absolute, t.right0, t.pR3]}>
        <HomeHeaderRightButtons />
      </View>
    </View>
  );
});

FeedTopBar.displayName = 'TopBar';

export { FeedTopBar, topBarHeight };
