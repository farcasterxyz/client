import { Octicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFeaturedApp, ApiFrame } from 'farcaster-client-data';
import {
  useAppLauncher,
  useFavoriteFrames,
  useFeaturedHeroApps,
  useTopFrames,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { AnimatedPressable, ScreenTitle } from 'farcaster-expo';
import React, {
  FC,
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TouchableOpacity,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneMap, TabView } from 'react-native-tab-view';

import {
  AppListItem,
  AppListItemSkeleton,
} from '~/components/Apps/AppListItem';
import { AppsFloatingSearch } from '~/components/AppsFloatingSearch/AppsFloatingSearch';
import { ButtonV2 } from '~/components/ButtonV2';
import {
  PressableGradient,
  useFabIconColor,
} from '~/components/FloatingSearch/PressableGradient';
import { FrameTile } from '~/components/Frames/FrameTile';
import { BrowserSearchIcon } from '~/components/icons';
import { CreateMiniAppIcon } from '~/components/icons/CreateMiniAppIcon';
import { RemoteImage } from '~/components/RemoteImage';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { SkeletonPlaceholder } from '~/components/SkeletonPlaceholder';
import { buildTabBar } from '~/components/TabBar';
import { Text2 } from '~/components/Text';
import { topBarHeight, useTopBar } from '~/components/TopBar';
import { hitSlop } from '~/constants/Pressable';
import { FavoriteFrameProvider } from '~/contexts/FavoriteFrameProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useAppState } from '~/hooks/useAppState';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { AppsHomeStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { getRoundedScreenAspectRatio } from '~/utils/ResponsiveUtils';

// Collapse/expand tween for the Discover header. The per-frame height
// interpolation runs on the UI thread via Reanimated, so it no longer contends
// for JS-thread time (the scroll-threshold detection still runs on JS).
const DISCOVER_TIMING_CONFIG = {
  duration: 350,
  easing: Easing.inOut(Easing.ease),
};

function HeaderBrowserButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      onPress={onPress}
      style={[
        {
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <BrowserSearchIcon size={22} color={t.colors.text.primary} />
    </AnimatedPressable>
  );
}

function CreateMiniAppFAB() {
  const t = useTheme();
  const fabIconColor = useFabIconColor();
  const push = usePush();
  return (
    <View style={[t.absolute, t.bottom0, t.right0, t.mR4, t.mB10]}>
      <AnimatedPressable
        style={[
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: 100, width: 56, height: 56 },
          Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
        ]}
        disableAnimation={Platform.OS === 'android'}
        onPress={() => push('Studio', {})}
      >
        <PressableGradient />
        <CreateMiniAppIcon size={24} color={fabIconColor} />
      </AnimatedPressable>
    </View>
  );
}

const PROMO_ASPECT_RATIO = 1.91;
const PROMO_OVERLAY_COLOR = '#24292E';
// Fallback Discover row: 72px icon + title (see FrameTile). Min height avoids a 0-height
// horizontal ScrollView on first layout, which pinned featuredHeight too small and
// clipped the carousel for the entire session (Android + iOS).
const DISCOVER_FALLBACK_CAROUSEL_MIN_HEIGHT = 108;
// OuterFeaturedApps: pT2 + Discover title (~22–24lg) + mB3 (~12) beneath title
const DISCOVER_VERTICAL_CHROME_EXTRA_PX = 56;

const APPS_TAB_INDEX = { trending: 1, yourApps: 0 } as const;

type AppsHomeScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'AppsHome'
>;
const AppsHomeScreen = buildScreen<AppsHomeScreenProps>(
  { name: 'AppsHome', insetTop: true },
  () => {
    return (
      <RetryableErrorBoundary>
        <AppsHome />
      </RetryableErrorBoundary>
    );
  },
);
AppsHomeScreen.displayName = 'AppsHomeScreen';

export const useScreenAvailableHeight = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const { height: screenHeight } = Dimensions.get('window');
  const roundedAspectRatio = getRoundedScreenAspectRatio();
  const insets = useSafeAreaInsets();
  const flatListPadding = 6;
  // It's unclear where these differences are coming from on Android.
  // Especially the fact that the React Native doesn't give you correct
  // screen dimensions on Android so the aspect ratios are off.
  // Tested on various physical and emulated devices and this worked out the best.
  // I suspect this should be much better on the new React Native architecture.
  // Especially since we could use onLayout to get the correct screen dimensions
  // for components.
  const androidFix = useMemo(() => {
    if (Platform.OS === 'android') {
      switch (roundedAspectRatio) {
        case 2:
          return -20;
        case 2.2:
          return 26;
        default:
          return 0;
      }
    }
    return 0;
  }, [roundedAspectRatio]);
  return Math.ceil(
    screenHeight -
      insets.top -
      topBarHeight -
      flatListPadding -
      tabBarHeight -
      androidFix,
  );
};

function FadedContainer({ children }: { children: React.ReactNode }) {
  const fadeAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>
  );
}

function OuterFeaturedApps({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[t.flexCol, t.pT2]}>
      <Text2 weight="semibold" size="lg" style={[t.pX3, t.mB3]}>
        Discover
      </Text2>
      {children}
    </View>
  );
}

const FeaturedAppInner = ({
  featuredApp,
  promoWidth,
  promoHeight,
  imageComponent,
}: {
  featuredApp: ApiFeaturedApp;
  promoWidth: number;
  promoHeight: number;
  imageComponent: JSX.Element;
}) => {
  const launchFrame = useLaunchFrame();
  const { trackEvent } = useTrackEvent();
  const t = useTheme();

  const launch = useCallback(() => {
    trackEvent(AnalyticsEvent.AppsHomeClickFeaturedApp, {
      domain: featuredApp.frame.domain,
    });
    launchFrame({
      context: { type: 'launcher' },
      config: {
        name: featuredApp.frame.name,
        url: featuredApp.frame.homeUrl,
        splashImageUrl: featuredApp.frame.splashImageUrl,
        splashBackgroundColor: featuredApp.frame.splashBackgroundColor,
      },
      author: featuredApp.frame.author,
      harmful: featuredApp.frame.harmful,
    });
  }, [featuredApp, launchFrame, trackEvent]);

  return (
    <View style={[t.flexCol]}>
      <AnimatedPressable
        style={[t.justifyCenter, t.itemsCenter]}
        onPress={launch}
      >
        <View
          style={[
            t.relative,
            {
              width: promoWidth,
              height: promoHeight,
              overflow: 'hidden',
              borderRadius: 16,
            },
          ]}
        >
          {imageComponent}
          <View
            style={[
              t.absolute,
              t.bottom0,
              t.wFull,
              {
                height: 60,
                backgroundColor: PROMO_OVERLAY_COLOR,
                opacity: 0.8,
              },
            ]}
          />

          <View style={[t.absolute, t.bottom0, t.p3, { width: promoWidth }]}>
            <AppListItem
              frame={featuredApp.frame}
              variant="no-open-button"
              nameColor="white"
              descriptionColor="#9FA3AF"
              disableTapHighlight
              disableAnimation={true}
              description={featuredApp.description}
              frameIconSize={36}
              onBeforeLaunch={() => {
                trackEvent(AnalyticsEvent.AppsHomeClickFeaturedApp, {
                  domain: featuredApp.frame.domain,
                });
              }}
            />
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
};

const FeaturedApps = ({
  promoHeight,
  promoWidth,
  forceSkeleton = false,
}: {
  promoHeight: number;
  promoWidth: number;
  forceSkeleton?: boolean;
}) => {
  const t = useTheme();
  const { data: featuredHeroApps, isLoading } = useFeaturedHeroApps();
  const shouldLoadFallbackTopFrames =
    !isLoading && (!featuredHeroApps || featuredHeroApps.length === 0);
  const {
    flatData: fallbackTopFrames = [],
    isLoading: isLoadingFallbackTopFrames,
  } = useTopFrames({
    enabled: shouldLoadFallbackTopFrames,
  });

  if (
    forceSkeleton ||
    isLoading ||
    (shouldLoadFallbackTopFrames && isLoadingFallbackTopFrames)
  ) {
    return (
      <OuterFeaturedApps>
        <View style={[t.flex1, t.pX3, t.flexRow, { gap: sizes.s2 }]}>
          <FadedContainer>
            <SkeletonPlaceholder
              style={[
                t.wFull,
                { borderRadius: 16 },
                { height: promoHeight, width: promoWidth },
              ]}
            />
          </FadedContainer>
          <FadedContainer>
            <SkeletonPlaceholder
              style={[
                t.wFull,
                { borderRadius: 16 },
                { height: promoHeight, width: promoWidth },
              ]}
            />
          </FadedContainer>
        </View>
      </OuterFeaturedApps>
    );
  }

  if (!featuredHeroApps || featuredHeroApps.length === 0) {
    if (!fallbackTopFrames.length) {
      return null;
    }

    return (
      <OuterFeaturedApps>
        <View style={{ minHeight: DISCOVER_FALLBACK_CAROUSEL_MIN_HEIGHT }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 2,
            }}
          >
            {fallbackTopFrames.slice(0, 12).map((frame) => (
              <View
                key={frame.domain}
                style={{
                  width: 92,
                  marginRight: 14,
                  alignItems: 'center',
                }}
              >
                <FrameTile frame={frame} frameIconSize={72} showTitle={true} />
              </View>
            ))}
          </ScrollView>
        </View>
      </OuterFeaturedApps>
    );
  }

  return (
    <OuterFeaturedApps>
      <View style={{ height: promoHeight }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          overScrollMode="never"
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 2,
          }}
        >
          {featuredHeroApps.map((item, heroIndex) => (
            <View
              key={item.frame.domain}
              style={{
                width: promoWidth,
                marginRight:
                  heroIndex < featuredHeroApps.length - 1 ? sizes.s3 : 0,
              }}
            >
              <FadedContainer>
                <FeaturedAppInner
                  featuredApp={item}
                  promoWidth={promoWidth}
                  promoHeight={promoHeight}
                  imageComponent={
                    <RemoteImage
                      uri={item.assets.heroImageUrl}
                      height={promoHeight}
                      width={promoWidth}
                      dangerouslySkipCloudinary={true}
                      contentFit="cover"
                      contentPosition="center"
                      containerStyle={[
                        {
                          borderRadius: 16,
                          overflow: 'hidden',
                          backgroundColor: '#111',
                        },
                      ]}
                    />
                  }
                />
              </FadedContainer>
            </View>
          ))}
        </ScrollView>
      </View>
    </OuterFeaturedApps>
  );
};

function YourAppsTab({
  backgroundColor,
  onScroll,
  refreshKey,
}: {
  backgroundColor: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  refreshKey?: number;
}) {
  const t = useTheme();
  const push = usePush();
  const [hiddenRecentlyUsedDomains, setHiddenRecentlyUsedDomains] = useState<
    Record<string, true>
  >({});
  const { width: screenWidth } = useWindowDimensions();
  // Align the first recently-used icon with the first saved-grid icon.
  // Saved grid: pX0 container, 33.33% cells, 72px icon centered → left = (screenWidth/3 - 72) / 2
  // Recently used: paddingLeft + (itemWidth - iconSize) / 2 = saved icon left
  const recentlyUsedPaddingLeft = Math.max(
    0,
    (screenWidth / 3 - 72) / 2 - (92 - 72) / 2,
  );
  const { trackEvent } = useTrackEvent();

  const {
    flatData: installedData = [],
    onEndReached,
    refetch: refetchFavoriteFrames,
    isFetchingNextPage,
    isLoading: isLoadingFavorites,
    error: favoriteFramesError,
  } = useFavoriteFrames();

  const {
    data: launcherData,
    refetch: refetchAppLauncher,
    isLoading: isLoadingLauncher,
    isRefetching: isRefetchingLauncher,
  } = useAppLauncher({
    enabled: true,
    weightRecency: 1,
    weightFrequency: 0,
    weightInstalled: 0,
  });

  const refreshApps = useCallback(() => {
    refetchFavoriteFrames({ cancelRefetch: false });
    refetchAppLauncher().catch(() => null);
  }, [refetchFavoriteFrames, refetchAppLauncher]);

  useEffect(() => {
    refreshApps();
  }, [refreshKey, refreshApps]);
  const launcherApps = useMemo(() => launcherData?.apps ?? [], [launcherData]);

  // Recent = launcher apps only
  const recentApps = useMemo(
    () => launcherApps.filter((app) => !hiddenRecentlyUsedDomains[app.domain]),
    [hiddenRecentlyUsedDomains, launcherApps],
  );

  // Saved = installed apps only
  const savedApps = useMemo(() => installedData, [installedData]);

  const showSkeleton =
    !launcherApps.length &&
    !installedData.length &&
    (isLoadingLauncher || isLoadingFavorites);

  const handleFrameRemoved = useCallback(
    (frame: ApiFrame) => {
      setHiddenRecentlyUsedDomains((prev) => {
        if (prev[frame.domain]) return prev;
        return { ...prev, [frame.domain]: true };
      });
      refreshApps();
    },
    [refreshApps],
  );

  const handleSavedSettingsPress = useCallback(() => {
    trackEvent(AnalyticsEvent.AppsHomeClickManageFavoriteApps, undefined);
    push('YourAppsSettings', {});
  }, [push, trackEvent]);

  const handleScrollInternal = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(e);

      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

      if (isCloseToBottom) {
        onEndReached();
      }
    },
    [onEndReached, onScroll],
  );

  if (!isLoadingFavorites && favoriteFramesError) {
    return (
      <View
        style={[
          t.flex1,
          t.itemsCenter,
          t.justifyCenter,
          { backgroundColor, paddingTop: 24 },
        ]}
      >
        <Text2 size="base" color="secondary">
          Failed to load your apps
        </Text2>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 32,
      }}
      onScroll={handleScrollInternal}
      scrollEventThrottle={64}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{ paddingTop: 2, paddingLeft: 20 }]}>
        <Text2 weight="semibold" size="lg">
          Recently used
        </Text2>
      </View>

      {showSkeleton ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`recent-skeleton-${i}`}
              style={{
                width: 82,
                marginRight: 18,
                alignItems: 'center',
              }}
            >
              <SkeletonPlaceholder
                style={[t.roundedL, { width: 68, height: 68 }]}
              />
              <SkeletonPlaceholder
                style={[t.roundedLg, { width: 56, height: 10, marginTop: 8 }]}
              />
            </View>
          ))}
        </ScrollView>
      ) : recentApps.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingLeft: recentlyUsedPaddingLeft,
            paddingRight: 110, // 92 (card width) + 18 (marginRight)
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {recentApps.map((frame) => (
            <View
              key={`recent-${frame.domain}`}
              style={{
                width: 92,
                marginRight: 18,
                alignItems: 'center',
              }}
            >
              <FrameTile
                frame={frame}
                frameIconSize={72}
                showTitle={true}
                onRemoved={handleFrameRemoved}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[t.pX4, t.pT3, { paddingBottom: 24 }]}>
          <Text2 size="base" color="secondary">
            No recently used apps
          </Text2>
        </View>
      )}

      <View
        style={[
          t.pX5,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          { paddingBottom: 10 },
        ]}
      >
        <Text2 weight="semibold" size="lg">
          Saved
        </Text2>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleSavedSettingsPress}
          hitSlop={hitSlop}
        >
          <Octicons name="gear" size={18} style={[t.texts.secondary]} />
        </TouchableOpacity>
      </View>

      {showSkeleton ? (
        <View
          style={[
            t.pX4,
            t.flexRow,
            t.flexWrap,
            {
              rowGap: 20,
            },
          ]}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={`saved-skeleton-${i}`}
              style={{
                width: '33.33%',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <SkeletonPlaceholder
                style={[t.roundedL, { width: 72, height: 72 }]}
              />
              <SkeletonPlaceholder
                style={[t.roundedLg, { width: 58, height: 10, marginTop: 10 }]}
              />
            </View>
          ))}
        </View>
      ) : savedApps.length === 0 ? (
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pT6]}>
          <Text2 size="base" color="secondary">
            No saved apps yet
          </Text2>
        </View>
      ) : (
        <View
          style={[
            t.pX0,
            t.flexRow,
            t.flexWrap,
            {
              rowGap: 20,
            },
          ]}
        >
          {savedApps.map((frame) => (
            <View
              key={`saved-${frame.domain}`}
              style={{
                width: '33.33%',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <FrameTile
                frame={frame}
                frameIconSize={72}
                showTitle={true}
                onRemoved={handleFrameRemoved}
              />
            </View>
          ))}
        </View>
      )}

      {isFetchingNextPage || isRefetchingLauncher ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={t.colors.loadingIndicator} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const AppsHome: FC = () => {
  const t = useTheme();
  const tabPullStartYRef = useRef<number | null>(null);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [refreshAppsKey, setRefreshAppsKey] = useState(0);
  const appState = useAppState();
  const prevAppStateRef = useRef(appState);
  useEffect(() => {
    if (prevAppStateRef.current !== 'active' && appState === 'active') {
      setRefreshAppsKey((prev) => prev + 1);
    }
    prevAppStateRef.current = appState;
  }, [appState]);
  const { width: screenWidth } = Dimensions.get('window');
  const promoHeight = useMemo(
    () => Math.ceil((screenWidth - sizes.s3 * 6) / PROMO_ASPECT_RATIO),
    [screenWidth],
  );
  const promoWidth = useMemo(
    () => Math.ceil(promoHeight * PROMO_ASPECT_RATIO),
    [promoHeight],
  );
  const bootstrapDiscoverLayoutHeight =
    promoHeight + DISCOVER_VERTICAL_CHROME_EXTRA_PX;
  const [routes] = useState([
    { key: 'your-apps', title: 'Your Apps' },
    { key: 'trending', title: 'Trending' },
  ]);

  const [searchAutoOpen, setSearchAutoOpen] = React.useState(false);

  // ── Collapsible Discover header ──────────────────────────────────────────
  // We animate the wrapper height between featuredHeight→0 on the UI thread
  // (Reanimated). The inner View is kept at a FIXED height (featuredHeight) so
  // FlashList stays fully constrained — overflow:hidden on the outer
  // Reanimated.View then clips it reliably even on iOS.
  const featuredHeightRef = useRef(bootstrapDiscoverLayoutHeight);
  const [featuredHeight, setFeaturedHeight] = useState(
    bootstrapDiscoverLayoutHeight,
  );
  const discoverProgress = useSharedValue(1); // 1 = open, 0 = closed
  const isAnimatingRef = useRef(false);
  // Clears the gate so the next scroll event can trigger a collapse/expand.
  const finishDiscoverAnimating = useCallback(() => {
    isAnimatingRef.current = false;
  }, []);
  const animateDiscover = useCallback(
    (toValue: number) => {
      discoverProgress.value = withTiming(
        toValue,
        DISCOVER_TIMING_CONFIG,
        () => {
          runOnJS(finishDiscoverAnimating)();
        },
      );
    },
    [discoverProgress, finishDiscoverAnimating],
  );
  const isDiscoverOpenRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const activeAppsTabIndexRef = useRef(index);
  activeAppsTabIndexRef.current = index;
  const discoverScrollPrimedRef = useRef(false);

  // TabView mounts neighbor scenes quickly; their FlashLists emit onScroll off-screen.
  // Timestamp of the last collapse – prevents instant re-expand on short lists
  // where the tab area grows after collapse and the ScrollView bounces to y=0.
  const lastCollapseTimeRef = useRef(0);
  const COLLAPSE_COOLDOWN_MS = 600;
  const handleTabBarTouchStart = useCallback((e: GestureResponderEvent) => {
    tabPullStartYRef.current = e.nativeEvent.pageY;
  }, []);

  const handleTabBarTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const startY = tabPullStartYRef.current;
      const endY = e.nativeEvent.pageY;

      if (startY === null) return;

      const diffY = endY - startY;
      tabPullStartYRef.current = null;

      if (
        diffY > 20 &&
        !isDiscoverOpenRef.current &&
        !isAnimatingRef.current &&
        Date.now() - lastCollapseTimeRef.current > 120
      ) {
        isAnimatingRef.current = true;
        isDiscoverOpenRef.current = true;

        animateDiscover(1);
      }
    },
    [animateDiscover],
  );
  const discoverAnimatedStyle = useAnimatedStyle(() => ({
    height: discoverProgress.value * Math.max(featuredHeight, 1),
  }));
  const handleScrollForDiscover = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>, sourceTabIndex: number) => {
      if (activeAppsTabIndexRef.current !== sourceTabIndex) return;

      const y = Math.max(0, e.nativeEvent.contentOffset.y);
      if (!discoverScrollPrimedRef.current) {
        discoverScrollPrimedRef.current = true;
        lastScrollYRef.current = y;
        return;
      }
      const diff = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (
        diff > 8 &&
        y > 24 &&
        isDiscoverOpenRef.current &&
        !isAnimatingRef.current
      ) {
        isAnimatingRef.current = true;
        isDiscoverOpenRef.current = false;
        lastCollapseTimeRef.current = Date.now();

        animateDiscover(0);
      } else if (
        y <= 8 &&
        diff < -4 &&
        !isDiscoverOpenRef.current &&
        !isAnimatingRef.current &&
        Date.now() - lastCollapseTimeRef.current > COLLAPSE_COOLDOWN_MS
      ) {
        isAnimatingRef.current = true;
        isDiscoverOpenRef.current = true;

        animateDiscover(1);
      }
    },
    [animateDiscover],
  );

  const trendingTabDiscoverScroll = useCallback(
    (nativeEvent: NativeSyntheticEvent<NativeScrollEvent>) =>
      handleScrollForDiscover(nativeEvent, APPS_TAB_INDEX.trending),
    [handleScrollForDiscover],
  );
  const yourAppsTabDiscoverScroll = useCallback(
    (nativeEvent: NativeSyntheticEvent<NativeScrollEvent>) =>
      handleScrollForDiscover(nativeEvent, APPS_TAB_INDEX.yourApps),
    [handleScrollForDiscover],
  );

  const onFeaturedLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = Math.round(e.nativeEvent.layout.height);
      const prev = featuredHeightRef.current;
      // Ignore transient zero-height layouts after the section has mounted.
      // Some list/render transitions briefly report 0 and permanently clip Discover.
      if (h === 0 && prev > 0) return;
      if (h === prev) return;
      featuredHeightRef.current = h;
      setFeaturedHeight(h);
      if (h > 0 && prev === 0) {
        discoverProgress.value = 1;
      }
    },
    [discoverProgress],
  );

  const title = React.useMemo(() => <ScreenTitle title="Apps" />, []);

  const rightIcons = React.useMemo(
    () => (
      <View style={[t.flexRow, t.itemsCenter]}>
        <HeaderBrowserButton onPress={() => setSearchAutoOpen(true)} />
      </View>
    ),
    [t.flexRow, t.itemsCenter],
  );

  const { topBar } = useTopBar({
    title,
    rightIcon: rightIcons,
  });

  const TrendingRoute = useCallback(
    () => <TrendingApps useRank={true} onScroll={trendingTabDiscoverScroll} />,
    [trendingTabDiscoverScroll],
  );

  const YourAppsRoute = useCallback(
    () => (
      <FavoriteFrameProvider>
        <YourAppsTab
          backgroundColor={t.colors.background.default}
          onScroll={yourAppsTabDiscoverScroll}
          refreshKey={refreshAppsKey}
        />
      </FavoriteFrameProvider>
    ),
    [t.colors.background.default, yourAppsTabDiscoverScroll, refreshAppsKey],
  );

  const renderScene = useMemo(
    () =>
      SceneMap({
        trending: TrendingRoute,
        'your-apps': YourAppsRoute,
      }),
    [TrendingRoute, YourAppsRoute],
  );

  const renderTabBar = useMemo(
    () =>
      buildTabBar({
        containerStyle: [
          t.bgDefault,
          t.borderB,
          t.borderDefault,
          { paddingTop: 8 },
        ],
      }),
    [t],
  );

  return (
    <View style={[t.hFull, t.flexCol]}>
      {topBar}
      <View style={[t.flex1, t.flexCol, { marginTop: topBarHeight }]}>
        <Reanimated.View
          style={[
            { overflow: 'hidden' },
            featuredHeight > 0 ? discoverAnimatedStyle : undefined,
          ]}
        >
          <View
            onLayout={onFeaturedLayout}
            style={featuredHeight > 0 ? { height: featuredHeight } : undefined}
          >
            <FeaturedApps promoHeight={promoHeight} promoWidth={promoWidth} />
          </View>
        </Reanimated.View>
        <View
          onTouchStart={handleTabBarTouchStart}
          onTouchEnd={handleTabBarTouchEnd}
          style={[t.flex1]}
        >
          <TabView
            lazy
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={(i) => {
              setIndex(i);
              lastScrollYRef.current = 0;
              discoverScrollPrimedRef.current = false;

              isDiscoverOpenRef.current = true;
              cancelAnimation(discoverProgress);
              discoverProgress.value = 1;
              if (routes[i]?.key === 'your-apps') {
                setRefreshAppsKey((prev) => prev + 1);
              }
            }}
            renderTabBar={renderTabBar}
            initialLayout={{ width: layout.width }}
          />
        </View>
      </View>
      <CreateMiniAppFAB />
      <AppsFloatingSearch
        showPressable={false}
        autoOpen={searchAutoOpen}
        onAutoOpenHandled={() => setSearchAutoOpen(false)}
      />
    </View>
  );
};

AppsHome.displayName = 'AppsHome';

export const TrendingApps = ({
  forceSkeleton = false,
  navbar,
  limit = 25,
  useRank = false,
  onScroll,
}: {
  forceSkeleton?: boolean;
  navbar?: React.ReactNode;
  limit?: number;
  useRank?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) => {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const push = usePush();
  const {
    flatData: flatDataWithoutLimit,
    isLoading,
    error,
    onEndReached,
    isFetchingNextPage,
  } = useTopFrames({
    // The most likely cause of errors here are network or backend issues.
    // Since TrendingApps is the meat of the screen we will throw the error
    // to trigger the error boundary so the Mini Apps screen's behavior aligns
    // with the rest of the screens.
    throwOnError: true,
  });

  const flatData = flatDataWithoutLimit;

  const renderSkeleton = useCallback(() => {
    return Array.from({ length: limit }).map((_, i) => (
      <View
        key={i}
        style={[t.pX3, t.pY1, t.flexRow, t.itemsCenter, { gap: sizes.s2 }]}
      >
        <AppListItemSkeleton height={60} />
      </View>
    ));
  }, [limit, t]);
  const renderTrendingItem = useCallback(
    ({ item, index }: { item: ApiFrame; index: number }) => {
      return (
        <AppListItem
          frameIconSize={56}
          frame={item}
          style={[t.pX4, { marginBottom: 20 }]}
          rank={useRank ? index + 1 : undefined}
          onBeforeLaunch={() => {
            trackEvent(AnalyticsEvent.AppsHomeClickTrendingApp, {
              domain: item.domain,
              index,
            });
          }}
          onBeforeAuthorPress={() => {
            trackEvent(AnalyticsEvent.AppsHomeClickTrendingAppAuthor, {
              authorFid: item.author?.fid,
              index,
            });
          }}
        />
      );
    },
    [t.pX4, trackEvent, useRank],
  );

  if (!isLoading && error) {
    return (
      <View style={[{ flex: 1 }]}>
        <View style={[t.flexRow, t.justifyBetween, t.itemsCenter, t.p3]}>
          <Text2 weight="semibold" size="lg">
            Trending
          </Text2>
          <ButtonV2
            variant="link"
            title="View all"
            height="xs"
            xPadding={0}
            onPress={() => {
              push('AppsCategory', { defaultSection: { type: 'trendingAll' } });
            }}
          />
        </View>
        <View style={[t.flex1, t.itemsCenter, t.pT3]}>
          <Text2 weight="medium" size="base" color="secondary">
            Failed to load trending mini apps, try again later.
          </Text2>
        </View>
      </View>
    );
  }

  return (
    <View style={[t.flex1, t.mT4]}>
      {navbar}
      {isLoading || forceSkeleton ? (
        renderSkeleton()
      ) : (
        <FlashList
          data={flatData ?? []}
          onScroll={onScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.domain}
          getItemType={() => 'app'}
          renderItem={renderTrendingItem}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          scrollEventThrottle={64}
          drawDistance={350}
          ListFooterComponent={
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              {isFetchingNextPage ? (
                <ActivityIndicator
                  size="large"
                  color={t.colors.loadingIndicator}
                />
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
};

export const YourAppsHeader = () => {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useTrackEvent();
  return (
    <View style={[t.pX3, t.bgDefault, { paddingVertical: 6 }]}>
      <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
        <Text2 weight="semibold" size="xl">
          Your Mini Apps
        </Text2>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            trackEvent(
              AnalyticsEvent.AppsHomeClickManageFavoriteApps,
              undefined,
            );
            push('YourAppsSettings', {});
          }}
          hitSlop={hitSlop}
        >
          <Octicons name="gear" size={16} style={[t.texts.primary]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export { AppsHomeScreen };
