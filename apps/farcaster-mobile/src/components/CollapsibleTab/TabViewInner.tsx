import {
  CommonActions,
  createNavigatorFactory,
  DefaultNavigatorOptions,
  NavigationProp,
  ParamListBase,
  TabActionHelpers,
  TabActions,
  TabNavigationState,
  TabRouter,
  TabRouterOptions,
  useFocusEffect,
  useNavigationBuilder,
} from '@react-navigation/native';
import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import PagerView, { PagerViewOnPageScrollEvent } from 'react-native-pager-view';

import {
  FlatListWithScrollIntoView,
  TabItemWithActive,
} from '~/components/CollapsibleTab/FlatListWithScrollIntoView';
import { useTheme } from '~/contexts/ThemeProvider';

// Tab component
export type TabViewTabProps = {
  isActive: boolean;
  onPress: () => void;
};
export type TabViewTabComponent = FC<TabViewTabProps>;

// Body component
export type TabViewBodyComponent = FC;

// Tab item
export type TabViewItem = {
  key: string;
  Tab: TabViewTabComponent;
  // Performance of rendering body as the controlled way is really high as it re-renders
  // the full tabs and each children. Avoid using this moving forward.
  DeprecatedPreRenderedBody: TabViewBodyComponent | undefined;
};

export type TabViewChangeReason = 'nav' | 'tab' | 'swipe';

export type TabViewProps = {
  items: TabViewItem[];
  tabBarWrapperStyle?: StyleProp<ViewStyle>;
  tabBarStyle?: StyleProp<ViewStyle>;
  onKeyChanged?: (key: string, reason: TabViewChangeReason) => void;
};

// We have no screen options (mainly because both state.routes and descriptors
// update on every render)
type TabViewScreenOptions = Record<string, never>;

// We emit no events
type TabViewEventMap = {
  tabPress: {
    data: undefined;
    canPreventDefault: false;
  };
};

// Props accepted by the main component
type TabViewAllProps = DefaultNavigatorOptions<
  ParamListBase,
  string,
  TabNavigationState<ParamListBase>,
  TabViewScreenOptions,
  TabViewEventMap,
  NavigationProp<ParamListBase>
> &
  TabRouterOptions &
  TabViewProps;

const TabViewInnerComp: FC<TabViewAllProps> = ({
  children,
  initialRouteName,
  screenOptions,
  items,
  tabBarWrapperStyle,
  tabBarStyle,
  onKeyChanged,
}) => {
  const t = useTheme();

  const { state, navigation, descriptors, NavigationContent } =
    useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      TabActionHelpers<ParamListBase>,
      TabViewScreenOptions,
      TabViewEventMap
    >(TabRouter, {
      children,
      initialRouteName,
      screenOptions,
    });

  const pagerViewRef = useRef<PagerView>(null);
  const pagerKeyRef = useRef<string>(state.routeNames[0]);
  const pagerIsAnimatingRef = useRef<boolean>(false);

  // We can't really know why the navigation changed (since we do it also when clicking tabs/swiping,
  // use a variable to record the last change reason, defaulting to 'nav'
  const lastChangeReason = useRef<TabViewChangeReason>('nav');

  // Switch pager based on navigation
  useEffect(() => {
    const routeKey = state.routeNames[state.index];

    if (pagerViewRef.current && pagerKeyRef.current !== routeKey) {
      pagerIsAnimatingRef.current = true;
      pagerKeyRef.current = routeKey;
      const newIndex = state.routeNames.indexOf(routeKey);
      // expand();
      pagerViewRef.current.setPageWithoutAnimation(newIndex);
    }

    if (onKeyChanged) {
      onKeyChanged(routeKey, lastChangeReason.current);
      lastChangeReason.current = 'nav';
    }
    // }, [expand, onKeyChanged, state.index, state.routeNames]);
  }, [onKeyChanged, state.index, state.routeNames]);

  // This is similar to useScrollToTop but always moves to the first tab and scroll it to the top
  // when not on the current
  useFocusEffect(
    useCallback(() => {
      const tabNavigations: NavigationProp<ReactNavigation.RootParamList>[] =
        [];
      let currentNavigation = navigation.getParent();
      while (currentNavigation) {
        if (currentNavigation.getState().type === 'tab') {
          // @ts-ignore
          tabNavigations.push(currentNavigation);
        }

        currentNavigation = currentNavigation.getParent();
      }

      const unsubscribers = tabNavigations.map((tab) => {
        // Capture the key of OUR tab in this navigator at register time.
        // useFocusEffect only runs when this screen is focused, which means
        // the parent tab navigator's currently-focused route IS the route
        // containing us. Comparing inside the listener via tab.getState()
        // is racy because react-navigation can update the focused index
        // before the tabPress listener fires, which makes the guard think
        // a press on a sibling tab is a re-press of our own tab and
        // erroneously preventDefault()s navigation to it.
        // @ts-ignore
        const ownerState = tab.getState() as
          | { routes: { key: string }[]; index: number }
          | undefined;
        const ownerKey = ownerState?.routes[ownerState.index]?.key;

        // @ts-ignore
        return tab.addListener('tabPress', (e: EventArg<'tabPress', true>) => {
          if (ownerKey === undefined || e.target !== ownerKey) {
            return;
          }

          const currentTabKey = pagerKeyRef.current;

          if (currentTabKey !== items[0].key) {
            // Active tab is not the first tab  -> switch to it and scroll to top

            // Prevent default action of focused tab scrolling to top
            e.preventDefault();

            // Count this as user pressing a tab
            lastChangeReason.current = 'tab';

            // Switch to first tab
            navigation.dispatch({
              ...TabActions.jumpTo(items[0].key),
              target: state.key,
            });

            // Scroll first tab to top
            navigation.emit({ type: 'tabPress' });
          }
        });
      });

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    }, [items, navigation, state.key]),
  );

  // Tab bar

  const onTabPress = useMemo(() => {
    return (key: string) => {
      const routeKey = state.routes.find((route) => route.name === key)?.key;
      lastChangeReason.current = 'tab';
      navigation.emit({
        type: 'tabPress',
        target: routeKey,
      });

      navigation.dispatch({
        ...TabActions.jumpTo(key),
        target: state.key,
      });
    };
  }, [navigation, state.key, state.routes]);

  const renderTabItem = useCallback(
    ({
      item: { item, isActive },
    }: {
      item: TabItemWithActive<TabViewItem>;
    }) => {
      return (
        <item.Tab isActive={isActive} onPress={() => onTabPress(item.key)} />
      );
    },
    [onTabPress],
  );

  // Pager

  const pagerStyle = useMemo(() => [t.hFull, t.wFull], [t.hFull, t.wFull]);

  const onPagerScroll = useMemo(() => {
    return (e: PagerViewOnPageScrollEvent) => {
      const newIndex = Math.round(
        e.nativeEvent.position + e.nativeEvent.offset,
      );
      const newKey = state.routeNames[newIndex];
      if (pagerIsAnimatingRef.current && newKey === pagerKeyRef.current) {
        // We are moving because navigation changed, and have reached the target
        pagerIsAnimatingRef.current = false;
      } else if (
        !pagerIsAnimatingRef.current &&
        newKey !== pagerKeyRef.current
      ) {
        // User swiped to a new page
        pagerIsAnimatingRef.current = true;
        pagerKeyRef.current = newKey;
        lastChangeReason.current = 'swipe';
        navigation.dispatch({
          ...CommonActions.navigate(newKey),
          target: state.key,
        });
      }
    };
  }, [navigation, state.key, state.routeNames]);

  const pagerScreens = useMemo(() => {
    return state.routes.map((route) => {
      return (
        <View key={route.name} style={[t.hFull]}>
          {descriptors[route.key].render()}
        </View>
      );
    });
  }, [descriptors, state.routes, t.hFull]);

  return (
    <NavigationContent>
      <View style={[t.hFull, t.flexCol, t.wFull]}>
        <View style={[t.wFull, tabBarWrapperStyle]}>
          <FlatListWithScrollIntoView
            selectedKey={state.routeNames[state.index]}
            contentContainerStyle={tabBarStyle}
            data={items}
            renderItem={renderTabItem}
          />
        </View>
        <View style={[t.flex1]}>
          <PagerView
            ref={pagerViewRef}
            style={pagerStyle}
            onPageScroll={onPagerScroll}
          >
            {pagerScreens}
          </PagerView>
        </View>
      </View>
    </NavigationContent>
  );
};

const createTabViewInner = createNavigatorFactory(TabViewInnerComp);

export const TabViewInner = createTabViewInner();
