import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { FeedTopBar } from '~/components/CollapsibleTab/FeedTopBar';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  useMinimalShellHeaderTransform,
  useShellLayout,
} from '~/screens/Feed/HomeScreenScrollHandlers';

type HomeHeaderWrapperProps = {
  children: React.ReactNode;
};

const HomeHeaderWrapper: React.FC<HomeHeaderWrapperProps> = React.memo(
  ({ children }) => {
    const t = useTheme();

    const headerMinimalShellTransform = useMinimalShellHeaderTransform();
    const { headerHeight } = useShellLayout();

    return (
      <Animated.View
        style={[
          t.absolute,
          t.top0,
          t.wFull,
          t.bgDefault,
          t.flexCol,
          {
            zIndex: 1,
          },
          headerMinimalShellTransform,
        ]}
        onLayout={(e) => (headerHeight.value = e.nativeEvent.layout.height)}
      >
        <FeedTopBar title="Home" />
        {children}
        <View
          style={[
            t.borderBHairline,
            t.borderDefault,
            t.absolute,
            t.left0,
            t.right0,
            { top: '100%' },
          ]}
        />
      </Animated.View>
    );
  },
);

HomeHeaderWrapper.displayName = 'HomeHeaderWrapper';

export { HomeHeaderWrapper };
