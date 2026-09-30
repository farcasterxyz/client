import {
  BottomTabBar as BaseBottomTabBar,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { InAppBrowserBar } from '~/components/InAppBrowser/InAppBrowserBar';
import { MiniAppBar } from '~/components/MiniApp/MiniAppBar';
import {
  SpaceMiniPlayer,
  useShouldShowSpaceMiniPlayer,
} from '~/components/spaces/SpaceMiniPlayer';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import { CastQueueToasts, useCastQueue } from '~/contexts/CastQueueProvider';
import { useMinimizedInAppBrowser } from '~/contexts/MinimizedInAppBrowserProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';

function BottomTabBar(props: BottomTabBarProps) {
  const { hasActivelyQueuedCasts } = useCastQueue();
  const { setBottomTabBarHeight } = useBottomTab();
  const shouldShowSpaceMiniPlayer = useShouldShowSpaceMiniPlayer();
  const { minimizedMiniApp } = useMinimizedMiniApp();
  const { minimizedInAppBrowser } = useMinimizedInAppBrowser({
    optional: true,
  });

  const onTabBarLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      setBottomTabBarHeight(event.nativeEvent.layout.height);
    },
    [setBottomTabBarHeight],
  );

  let castingQueueToasts;
  if (hasActivelyQueuedCasts) {
    castingQueueToasts = <CastQueueToasts />;
  }

  let miniAppBar;
  if (minimizedMiniApp) {
    miniAppBar = <MiniAppBar {...minimizedMiniApp} />;
  }

  let inAppBrowserBar;
  if (minimizedInAppBrowser) {
    inAppBrowserBar = <InAppBrowserBar {...minimizedInAppBrowser} />;
  }

  const hasAnyDockedBar =
    shouldShowSpaceMiniPlayer || !!miniAppBar || !!inAppBrowserBar;

  return (
    <>
      {castingQueueToasts}
      {hasActivelyQueuedCasts && hasAnyDockedBar && (
        <View style={{ height: 12 }} />
      )}
      {shouldShowSpaceMiniPlayer ? <SpaceMiniPlayer /> : null}
      {miniAppBar}
      {inAppBrowserBar}
      <View onLayout={onTabBarLayout}>
        <BaseBottomTabBar {...props} />
      </View>
    </>
  );
}

export { BottomTabBar };
