import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { InnerDrawerContent } from '~/components/DrawerContent';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { useDrawerNavigation } from '~/contexts/DrawerNavigationHolderProvider';
import { SWIPE_EDGE_WIDTH } from '~/contexts/DrawerProvider';
import { DrawerParamList } from '~/types/navigation';

import { BottomTabNavigator } from './BottomTabNavigator';

const Drawer = createDrawerNavigator<DrawerParamList>();

const AuthedDrawerNavigator = memo(() => {
  const { setNavigation } = useDrawerNavigation();

  const { width } = useWindowDimensions();

  const drawerWidth = useMemo(() => {
    // 72: 48 pfp + 12 * 2 spacing
    return width - 72;
  }, [width]);

  const drawerOptions = useCallback(
    (props: {
      route: RouteProp<DrawerParamList, 'BottomTabs'>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: any;
    }) => {
      // We need to pass a reference to the navigation object
      // to `DrawerProvider`, so we can later reference it
      // when we need to enable/disable swipe gestures for the draw.
      // Unfortunately, the drawer navigator does not seem to
      // support refs or provide any means of imperatively
      // updating options, so this is how it must be for now.
      // Also worth noting that we wrap the call in a `setTimeout`
      // to avoid a warning about a bad `setState` update.
      setTimeout(() => setNavigation(props.navigation));
      // ^ TODO: see if we can avoid this

      return {
        headerShown: false,
        swipeEdgeWidth: SWIPE_EDGE_WIDTH,
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: 'transparent',
        },
      };
    },
    [drawerWidth, setNavigation],
  );

  const drawerContent = useCallback((_props: DrawerContentComponentProps) => {
    return (
      <React.Suspense
        fallback={<FullScreenLoadingIndicator debugName="DrawerContent" />}
      >
        <InnerDrawerContent />
      </React.Suspense>
    );
  }, []);

  // memoize bottom tab navigator to avoid rerendering from
  // props passed via the drawer.screen component
  const BottomTabNavigatorMemo = useCallback(() => <BottomTabNavigator />, []);

  return (
    <Drawer.Navigator
      initialRouteName="BottomTabs"
      drawerContent={drawerContent}
    >
      <Drawer.Screen
        name="BottomTabs"
        component={BottomTabNavigatorMemo}
        options={drawerOptions}
      />
    </Drawer.Navigator>
  );
});

export { AuthedDrawerNavigator };
