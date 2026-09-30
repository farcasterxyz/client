import {
  BottomTabBarButtonProps,
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useUnseen } from 'farcaster-client-hooks';
import {
  useHaptics,
  useWalletGeoRestricted,
  WalletTabIcon,
} from 'farcaster-expo';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BottomTabBar } from '~/components/BottomTabBar';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { WalletStackNavigator } from '~/navigation/WalletStack';
import { BottomTabName, BottomTabsParamList } from '~/types';
import { alreadyNudgedWalletTab } from '~/utils/FastStorageUtils';

import { AppsHomeStackNavigator } from './AppsHomeStack';
import { BottomTabNavigatorContext } from './BottomTabNavigatorContext';
import { HomeStackNavigator } from './HomeStack';
import {
  Default as DefaultDirectCastsIcon,
  Selected as SelectedDirectCastsIcon,
} from './Icons/BottomTabDirectCastsIcon';
import {
  Default as DefaultExploreFeedIcon,
  Selected as SelectedExploreFeedIcon,
} from './Icons/BottomTabExploreFeedIcon';
import {
  Default as DefaultExploreIcon,
  Selected as SelectedExploreIcon,
} from './Icons/BottomTabExploreIcon';
import {
  Default as DefaultHomeIcon,
  Selected as SelectedHomeIcon,
} from './Icons/BottomTabHomeIcon';
import {
  Default as DefaultMiniAppsIcon,
  Selected as SelectedMiniAppsIcon,
} from './Icons/BottomTabMiniAppsIcon';
import {
  Default as DefaultNotificationsIcon,
  Selected as SelectedNotificationsIcon,
} from './Icons/BottomTabNotificationsIcon';
import { NotificationsStackNavigator } from './NotificationsStack';
import { PlaintextDirectCastsStackNavigator } from './PlaintextDirectCastsStack';

const BottomTab = createBottomTabNavigator<BottomTabsParamList>();

const tabBar = (props: BottomTabBarProps) => <BottomTabBar {...props} />;

const BottomTabNavigator = memo(() => {
  const { setFocusedBottomTab } = useBottomTab();

  const { notificationsCount, inboxCount } = useUnseen();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const shouldShowMiniApps = checkUserAppContextGate('mini-apps').value;

  const walletGeoRestricted = useWalletGeoRestricted();

  const getTabBarButton = useCallback(
    (name: BottomTabName, selected: boolean, onLongPress?: () => void) =>
      ({ onPress }: BottomTabBarButtonProps) => {
        return (
          <TabBarButton
            // BottomTabNavigator wants onPress to have an argument of
            // type GestureResponderEvent but we don't want that here
            onPress={onPress as () => void | undefined}
            onLongPress={onLongPress}
            selected={selected}
            name={name}
            containsRestrictedFunctionality={
              name === 'WalletTab' && walletGeoRestricted
            }
            notificationCount={
              name === 'NotificationsTab'
                ? notificationsCount
                : name === 'DirectCastsTab'
                  ? inboxCount
                  : 0
            }
          />
        );
      },
    [inboxCount, notificationsCount, walletGeoRestricted],
  );

  const [, setTabBarTopBorderHidden] = React.useState(false);

  const bottomTabNavigatorContextValue = React.useMemo(
    () => ({ setTabBarTopBorderHidden }),
    [],
  );

  const initialRouteName: keyof BottomTabsParamList = 'HomeTab';

  return (
    <BottomTabNavigatorContext.Provider value={bottomTabNavigatorContextValue}>
      <BottomTab.Navigator
        initialRouteName={initialRouteName}
        // Work around react-native-screens@4.23 + iOS 26 wedging the tab
        // switch after ~7-10 min — keep all tab roots attached.
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          lazy: true,
          tabBarStyle: { borderTopWidth: 0 },
        }}
        screenListeners={{
          focus: (e) => {
            if (e.target) {
              const tabName = e.target.split('-')[0];
              if (tabName) {
                setFocusedBottomTab(tabName as BottomTabName);
              }
            }
          },
        }}
        tabBar={tabBar}
      >
        <BottomTab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={({ navigation }) => ({
            title: 'Home',
            tabBarShowLabel: false,
            tabBarButton: getTabBarButton('HomeTab', navigation.isFocused()),
          })}
        />
        {shouldShowMiniApps && (
          <BottomTab.Screen
            name="AppsHomeTab"
            component={AppsHomeStackNavigator}
            options={({ navigation }) => ({
              title: 'Apps',
              tabBarShowLabel: false,
              tabBarButton: getTabBarButton(
                'AppsHomeTab',
                navigation.isFocused(),
              ),
            })}
          />
        )}
        <BottomTab.Screen
          name="WalletTab"
          component={WalletStackNavigator}
          options={({ navigation }) => ({
            title: 'Wallet',
            tabBarShowLabel: false,
            tabBarButton: getTabBarButton('WalletTab', navigation.isFocused()),
          })}
        />
        <BottomTab.Screen
          name="NotificationsTab"
          component={NotificationsStackNavigator}
          options={({ navigation }) => ({
            title: 'Notifications',
            tabBarShowLabel: false,
            tabBarButton: getTabBarButton(
              'NotificationsTab',
              navigation.isFocused(),
            ),
          })}
        />
        <BottomTab.Screen
          name="DirectCastsTab"
          component={PlaintextDirectCastsStackNavigator}
          options={({ navigation }) => ({
            title: 'DirectCasts',
            tabBarShowLabel: false,
            tabBarButton: getTabBarButton(
              'DirectCastsTab',
              navigation.isFocused(),
            ),
          })}
        />
      </BottomTab.Navigator>
    </BottomTabNavigatorContext.Provider>
  );
});

function checkIfWeShouldNudge({ name }: { name: 'WalletTab' }) {
  switch (name) {
    case 'WalletTab':
      return alreadyNudgedWalletTab() === false;
  }
}

const TabBarButton = memo(
  ({
    name,
    containsRestrictedFunctionality,
    selected,
    onPress: onPressCallback,
    onLongPress: onLongPressCallback,
    notificationCount,
  }: {
    name: BottomTabName;
    containsRestrictedFunctionality?: boolean;
    selected?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    notificationCount: number;
  }) => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const { checkGate } = useGlobalGate();

    const { value: ingestNavEvents } = checkGate(
      'ingest_mobile_navigation_events',
    );

    const trackPressNavigationEvent = React.useCallback(() => {
      if (ingestNavEvents) {
        trackEvent(AnalyticsEvent.BottomTabNavigate, { name });
      }
    }, [ingestNavEvents, name, trackEvent]);

    const trackLongPressNavigationEvent = React.useCallback(() => {
      if (ingestNavEvents) {
        trackEvent(AnalyticsEvent.BottomTabNavigate, { name });

        trackEvent(AnalyticsEvent.BottomTabLongPress, { name });
      }
    }, [ingestNavEvents, name, trackEvent]);

    const onPress = React.useCallback(() => {
      trackPressNavigationEvent();

      onPressCallback?.();
    }, [onPressCallback, trackPressNavigationEvent]);

    const onLongPress = React.useCallback(() => {
      trackLongPressNavigationEvent();

      if (typeof onLongPress === 'function') {
        onLongPressCallback?.();
      } else {
        // Let's do a fallback here so long press still navigates properly
        onPressCallback?.();
      }
    }, [onLongPressCallback, onPressCallback, trackLongPressNavigationEvent]);

    const press = useSharedValue(0);

    useEffect(() => {
      press.value = 0;
    }, [press]);

    const styleAnimatedIcon = useAnimatedStyle(() => ({
      transform: [{ scale: press.value ? 0.95 : 1 }],
    }));

    const selectedIconColor = t.colors.text.primary;
    const iconColor = t.colors.text.primary;

    const iconElement = useMemo(() => {
      switch (name) {
        case 'AppsHomeTab':
          if (selected) {
            return <SelectedMiniAppsIcon />;
          } else {
            return <DefaultMiniAppsIcon />;
          }
        case 'DirectCastsTab':
          if (selected) {
            return <SelectedDirectCastsIcon />;
          } else {
            return <DefaultDirectCastsIcon />;
          }
        case 'HomeTab':
          if (selected) {
            return <SelectedHomeIcon />;
          } else {
            return <DefaultHomeIcon />;
          }
        case 'ExploreTab':
          if (selected) {
            return <SelectedExploreIcon />;
          } else {
            return <DefaultExploreIcon />;
          }
        case 'NewsTab':
          if (selected) {
            return <SelectedExploreFeedIcon />;
          } else {
            return <DefaultExploreFeedIcon />;
          }
        case 'NotificationsTab':
          if (selected) {
            return <SelectedNotificationsIcon />;
          } else {
            return <DefaultNotificationsIcon />;
          }
        case 'WalletTab':
          return (
            <WalletTabIcon
              selected={selected}
              iconColor={selected ? selectedIconColor : iconColor}
            />
          );
      }
    }, [name, selected, selectedIconColor, iconColor]);

    const hasNew =
      name === 'WalletTab' &&
      !containsRestrictedFunctionality &&
      checkIfWeShouldNudge({ name });

    return (
      <FancyTabBarButton
        // NEYN-11640: stable per-tab selector for the Maestro E2E suite
        // (`bottom-tab-${name}`). React Navigation hides the visible label
        // for these buttons (`tabBarShowLabel: false`) and the icon-only
        // PressableScale carries no accessible text, so id is the only
        // reliable selector.
        testID={`bottom-tab-${name}`}
        onPress={onPress}
        onLongPress={onLongPress}
        icon={
          <Animated.View style={styleAnimatedIcon}>{iconElement}</Animated.View>
        }
        notificationCount={selected ? 0 : notificationCount}
        hasNew={!selected && hasNew}
      />
    );
  },
);

TabBarButton.displayName = 'TabBarButton';

BottomTabNavigator.displayName = 'BottomTabNavigator';

export { BottomTabNavigator };

const notificationsBadgeStyle = {
  position: 'absolute',
  left: '52%',
  top: 8,
  zIndex: 1,
  minHeight: 16,
  minWidth: 16,
} as ViewStyle;

const hasNewBadgeStyle = {
  position: 'absolute',
  left: '62.5%',
  top: 12,
  zIndex: 1,
  paddingHorizontal: 1.5,
  minHeight: 8,
  minWidth: 8,
} as ViewStyle;

interface FancyTabBarButtonProps {
  icon: React.ReactNode;
  notificationCount?: number;
  hasNew?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  testID?: string;
}

function FancyTabBarButton({
  icon,
  hasNew,
  notificationCount,
  onPress,
  onLongPress,
  testID,
}: FancyTabBarButtonProps) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      triggerImpactAsync();
      onPress?.(event);
    },
    [onPress, triggerImpactAsync],
  );

  return (
    <PressableScale
      testID={testID}
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 4,
        },
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      targetScale={0.8}
    >
      {icon}
      {notificationCount !== 0 ? (
        <View
          style={[
            t.bgNotification,
            t.roundedFull,
            t.justifyCenter,
            t.textCenter,
            notificationsBadgeStyle,
          ]}
        >
          <Text style={[t.texts.light, t.textCenter, { fontSize: 10 }]}>
            {notificationCount}
          </Text>
        </View>
      ) : hasNew ? (
        <View style={[t.bgNotification, t.roundedFull, hasNewBadgeStyle]} />
      ) : null}
    </PressableScale>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  targetScale = 0.98,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: {
  targetScale?: number;
  style?: StyleProp<ViewStyle>;
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        onPressIn?.(e);
        cancelAnimation(scale);
        scale.value = withTiming(targetScale, { duration: 100 });
      }}
      onPressOut={(e) => {
        onPressOut?.(e);
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
