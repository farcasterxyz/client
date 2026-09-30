import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiEthNonFungibleToken, ApiLimitOrder } from 'farcaster-client-data';
import { useLimitOrder } from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  AutoDisplayingBottomSheetModal,
  isAddress,
  ManageTokens,
  setWalletTabNudged,
  SPACING,
  Text2,
  TokenListItemPlaceholder,
  USDCBalances,
  useEmbeddedWallet,
  useSharedTelemetry,
  useShowWalletOrdersTab,
  useTheme,
  useWalletBalances,
  useWalletGeoRestricted,
  WALLET_NUX_CONFIG,
  WalletActivityV2,
  WalletCollectibles,
  WalletCollectiblesItemsPlaceholder,
  WalletHomeHeader,
  WalletHomeNuxBackground,
  WalletHomeOverview,
  WalletHomeSearch,
  WalletNotAvailableInRegion,
  WalletOrderDetailModal,
  WalletOrdersList,
  WalletTokenBalances,
} from 'farcaster-expo';
import { Eye } from 'lucide-react-native';
import React from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { type Hex, isAddressEqual } from 'viem';

import { PulseFeed } from '~/components/ExploreFeed/PulseFeed';
import { FloatingComposerButton } from '~/components/FloatingComposerButton';
import {
  Pager,
  PagerRef,
  RenderTabBarFnProps,
} from '~/components/HomeFeedPagers/Pager';
import { buildScreen } from '~/components/Screen';
import { WalletLinksCarousel } from '~/components/Wallet/WalletLinksCarousel';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNoSeedPhrasePrompt } from '~/contexts/NoSeedPhrasePromptProvider';
import { useOpenDrawer } from '~/hooks/navigation/useOpenDrawer';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import {
  clearWalletOrdersDeepLinkPending,
  registerWalletHomeDeepLinkHandler,
  shouldSuppressWalletHomeFocusResync,
} from '~/hooks/navigation/walletHomeDeepLink';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { WalletStackParamList } from '~/types/navigation';

type WalletScreenProps = NativeStackScreenProps<WalletStackParamList, 'Wallet'>;

// Animation boundary constants for the wallet header
const SCROLL_MIN_BOUNDARY = -216; // Minimum scroll offset for header expansion
const SCROLL_MAX_BOUNDARY = 108; // Maximum scroll offset for header compression
const SCROLL_DISTANCE_THRESHOLD = 2; // Minimum scroll distance to trigger update when out of bounds
// Fallback until wallet overview + tab bar heights are measured on first layout.
const ESTIMATED_WALLET_HEADER_GAP = 280;
const WALLET_TAB_COLLECTIBLES = 2;
const WALLET_TAB_ORDERS = 3;
const WALLET_TAB_HISTORY_WITH_ORDERS = 4;
const WALLET_TAB_HISTORY_WITHOUT_ORDERS = 3;

function getWalletHistoryTabIndex(showWalletOrdersTab: boolean) {
  return showWalletOrdersTab
    ? WALLET_TAB_HISTORY_WITH_ORDERS
    : WALLET_TAB_HISTORY_WITHOUT_ORDERS;
}

function getWalletOrdersTabIndex(showWalletOrdersTab: boolean) {
  return showWalletOrdersTab ? WALLET_TAB_ORDERS : undefined;
}

function mapWalletTabIndexForOrdersVisibilityChange(
  index: number,
  showWalletOrdersTab: boolean,
  previouslyShowedWalletOrdersTab: boolean,
) {
  if (showWalletOrdersTab === previouslyShowedWalletOrdersTab) {
    return index;
  }

  if (previouslyShowedWalletOrdersTab && !showWalletOrdersTab) {
    if (index === WALLET_TAB_ORDERS) {
      return 0;
    }
    if (index === WALLET_TAB_HISTORY_WITH_ORDERS) {
      return WALLET_TAB_HISTORY_WITHOUT_ORDERS;
    }
    return index;
  }

  if (index === WALLET_TAB_HISTORY_WITHOUT_ORDERS) {
    return WALLET_TAB_HISTORY_WITH_ORDERS;
  }

  return index;
}

function getEffectiveHeaderGap(headerGapHeight: number) {
  return headerGapHeight > 0 ? headerGapHeight : ESTIMATED_WALLET_HEADER_GAP;
}

export const WalletScreen = buildScreen<WalletScreenProps>(
  {
    name: 'Wallet',
    insetTop: true,
    themeV2: true,
  },
  (props) => {
    const geoRestricted = useWalletGeoRestricted();

    const initialTabParam = props.route.params?.initialTab;
    const initialLimitOrderIdParam = props.route.params?.limitOrderId;

    React.useEffect(() => {
      if (initialTabParam) {
        props.navigation.setParams({ initialTab: undefined });
      }
    }, [initialTabParam, props.navigation]);

    React.useEffect(() => {
      if (initialLimitOrderIdParam) {
        props.navigation.setParams({ limitOrderId: undefined });
      }
    }, [initialLimitOrderIdParam, props.navigation]);

    // Consume the param once and clear it so the bottom sheet doesn't open again
    const usdcLendingLearnMore = props.route.params?.usdcLendingLearnMore;
    React.useEffect(() => {
      if (usdcLendingLearnMore) {
        props.navigation.setParams({ usdcLendingLearnMore: undefined });
      }
    }, [usdcLendingLearnMore, props.navigation]);

    useFocusEffect(
      React.useCallback(() => {
        setWalletTabNudged({ nudged: true });
      }, []),
    );

    if (geoRestricted) {
      return <WalletNotAvailableInRegion />;
    }

    return (
      <WalletHome
        initialTab={initialTabParam}
        usdcLendingLearnMore={usdcLendingLearnMore}
        initialLimitOrderId={initialLimitOrderIdParam}
      />
    );
  },
);

function WalletHome({
  initialTab,
  usdcLendingLearnMore,
  initialLimitOrderId,
}: {
  initialTab?: 'orders';
  usdcLendingLearnMore?: boolean;
  initialLimitOrderId?: string;
}) {
  const t = useTheme();

  const { checkUserAppContextGate } = useUserAppContextGate();
  const applyLimitedFunctionality =
    !checkUserAppContextGate('wallet-intents').value;
  const { showWalletOrdersTab } = useShowWalletOrdersTab();
  const walletOrdersTabIndex = getWalletOrdersTabIndex(showWalletOrdersTab);
  const walletHistoryTabIndex = getWalletHistoryTabIndex(showWalletOrdersTab);
  const prevShowWalletOrdersTabRef = React.useRef(showWalletOrdersTab);

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState<string | null>(null);

  const push = usePush();
  const handleSeeAllLimitOrderFills = React.useCallback(
    (order: ApiLimitOrder) => {
      push('WalletLimitOrderFills', { order });
    },
    [push],
  );
  const [notificationLimitOrder, setNotificationLimitOrder] =
    React.useState<ApiLimitOrder | null>(null);
  const [pendingNotificationOrder, setPendingNotificationOrder] =
    React.useState<ApiLimitOrder | null>(null);
  const [pendingLimitOrderId, setPendingLimitOrderId] =
    React.useState(initialLimitOrderId);
  const [isOrdersDeepLinkInProgress, setIsOrdersDeepLinkInProgress] =
    React.useState(false);
  const dismissOrdersListSelectedOrderRef = React.useRef<(() => void) | null>(
    null,
  );

  const requestNotificationLimitOrder = React.useCallback(
    (limitOrderId: string) => {
      dismissOrdersListSelectedOrderRef.current?.();
      setNotificationLimitOrder(null);
      setPendingNotificationOrder(null);
      setPendingLimitOrderId(limitOrderId);
    },
    [],
  );

  const {
    data: limitOrderResult,
    isSuccess: isLimitOrderSuccess,
    isError: isLimitOrderError,
  } = useLimitOrder({
    orderId: pendingLimitOrderId ?? '',
    enabled: !!pendingLimitOrderId,
  });

  React.useEffect(() => {
    if (!pendingLimitOrderId) {
      return;
    }

    if (isLimitOrderSuccess) {
      if (limitOrderResult?.order) {
        setPendingNotificationOrder(limitOrderResult.order);
      }
      setPendingLimitOrderId(undefined);
      return;
    }

    if (isLimitOrderError) {
      setPendingLimitOrderId(undefined);
      setPendingNotificationOrder(null);
    }
  }, [
    isLimitOrderError,
    isLimitOrderSuccess,
    limitOrderResult,
    pendingLimitOrderId,
  ]);
  const handleSetSearchQuery = React.useCallback(
    (query: string | null) => {
      if (query === null) {
        setSearchQuery(null);
        return;
      }
      const trimmedQuery = query.trim();
      // '' = open with empty query; null = closed
      if (!trimmedQuery) {
        setSearchQuery('');
      } else if (isAddress(trimmedQuery)) {
        push('TokenCA', { ca: trimmedQuery, via: 'search_query' });
      } else {
        setSearchQuery(trimmedQuery);
      }
    },
    [push, setSearchQuery],
  );

  const scrollOffset = useSharedValue(0);
  const headerHeight = useSharedValue(0);
  const tabBarHeight = useSharedValue(0);
  const lastScrollOffset = useSharedValue(0);
  const ordersListRef = React.useRef<FlatList<ApiLimitOrder>>(null);
  const [headerGapHeight, setHeaderGapHeight] = React.useState(0);

  useAnimatedReaction(
    () => headerHeight.value + tabBarHeight.value,
    (height, previousHeight) => {
      if (height > 0 && height !== previousHeight) {
        scheduleOnRN(setHeaderGapHeight, height);
      }
    },
  );

  const resetWalletHomeScrollToTop = React.useCallback(() => {
    scrollOffset.value = 0;
    lastScrollOffset.value = 0;
    requestAnimationFrame(() => {
      ordersListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [lastScrollOffset, scrollOffset]);

  React.useEffect(() => {
    if (initialTab === 'orders' || initialLimitOrderId) {
      resetWalletHomeScrollToTop();
    }
  }, [initialLimitOrderId, initialTab, resetWalletHomeScrollToTop]);

  const openDrawer = useOpenDrawer();

  const { connect, evmAddress } = useEmbeddedWallet();
  const { trackEvent } = useSharedTelemetry();
  // INCIDENT-RELATED TEMPORARY CODE (no-custody-wallet restore prompt) — remove ~6-8mo out.
  const { promptRestoreWallet } = useNoSeedPhrasePrompt();

  React.useEffect(() => {
    if (!evmAddress) {
      trackEvent(AnalyticsEvent.EmbeddedWalletEvent, {
        type: 'viewed wallet connecting',
      });
      connect().catch(() => {
        trackEvent(AnalyticsEvent.EmbeddedWalletEvent, {
          type: 'viewed wallet connecting failed',
        });
      });
    }
  }, [connect, evmAddress, trackEvent]);

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewWallet);
      // Show the restore prompt every time the wallet screen opens (no-op
      // unless the Farcaster account recovery phrase is missing).
      promptRestoreWallet();
    }, [trackEvent, promptRestoreWallet]),
  );

  const { totalBalance } = useWalletBalances();
  const [isWalletNux, setIsWalletNux] = React.useState(
    totalBalance !== undefined &&
      totalBalance! <= WALLET_NUX_CONFIG.WALLET_BALANCE_MAX_THRESHOLD &&
      totalBalance! >= WALLET_NUX_CONFIG.WALLET_BALANCE_MIN_THRESHOLD,
  );
  const progress = useSharedValue(
    isWalletNux
      ? WALLET_NUX_CONFIG.PROGRESS_START_POINT
      : WALLET_NUX_CONFIG.PROGRESS_END_POINT,
  );

  React.useEffect(() => {
    if (
      totalBalance !== undefined &&
      totalBalance > WALLET_NUX_CONFIG.WALLET_BALANCE_MAX_THRESHOLD &&
      isWalletNux
    ) {
      progress.value = withDelay(
        WALLET_NUX_CONFIG.DELAY,
        withTiming(
          WALLET_NUX_CONFIG.PROGRESS_END_POINT,
          { duration: WALLET_NUX_CONFIG.DURATION },
          () => {
            scheduleOnRN(setIsWalletNux, false);
          },
        ),
      );
    }
  }, [progress, totalBalance, isWalletNux]);

  const { setUserProperties } = useAnalytics();

  React.useEffect(() => {
    if (totalBalance !== undefined) {
      setUserProperties({ 'wallet-total-balance': totalBalance });
    }
  }, [totalBalance, setUserProperties]);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll(e) {
        'worklet';
        const currentOffset = e.contentOffset.y;
        const lastOffset = lastScrollOffset.value;

        const isWithinBounds =
          currentOffset >= SCROLL_MIN_BOUNDARY &&
          currentOffset <= SCROLL_MAX_BOUNDARY;
        const hasSignificantMovement =
          Math.abs(currentOffset - lastOffset) > SCROLL_DISTANCE_THRESHOLD;

        if (isWithinBounds || hasSignificantMovement) {
          scrollOffset.value = currentOffset;
          lastScrollOffset.value = currentOffset;
        }
      },
    },
    [],
  );

  const pagerRef = React.useRef<PagerRef>(null);
  const deepLinkInProgressRef = React.useRef(false);
  // Stable Android guard target — frozen at first render so mount-time spurious
  // page events don't fight a shifting deep-link target.
  const pagerInitialPageRef = React.useRef(
    !applyLimitedFunctionality &&
      (initialTab === 'orders' || !!initialLimitOrderId) &&
      showWalletOrdersTab &&
      walletOrdersTabIndex !== undefined
      ? walletOrdersTabIndex
      : 0,
  );
  const pagerInitialPage = pagerInitialPageRef.current;
  const shouldDeepLinkToOrdersTab =
    !applyLimitedFunctionality && showWalletOrdersTab;

  // One-shot deep link to Orders; cleared after navigation or user tab change.
  const [pendingOrdersTab, setPendingOrdersTab] = React.useState(
    () =>
      initialTab === 'orders' ||
      (!!initialLimitOrderId && shouldDeepLinkToOrdersTab),
  );
  const [selectedIndex, setSelectedIndex] =
    React.useState<number>(pagerInitialPage);
  // Tracks whether the user has already driven a tab change (swipe or
  // tab tap) so the Android initial-page workaround below doesn't snap
  // them back to Tokens after an intentional navigation.
  const userInteractedRef = React.useRef(false);
  const forcingInitialPageRef = React.useRef(false);
  const settledAtTargetRef = React.useRef(false);

  // Tracks the last index the user actually settled on (real tap or
  // completed swipe), distinct from `selectedIndex` which can be moved by
  // spurious native events during blur/focus cycles. Used by the focus
  // resync below so a drifted state doesn't poison the restore target.
  const lastSettledIndexRef = React.useRef(pagerInitialPage);
  // True from `dragging` until the matching `onPageSelected`. Distinguishes
  // a real swipe back to Tokens from a spurious page-0 event during
  // blur/focus when `onPageSelecting(0, 'swipe')` never fires (Pager skips
  // scroll events at offset === 0).
  const userDraggingRef = React.useRef(false);

  const navigateToOrdersTabDeepLink = React.useCallback(
    ({ limitOrderId }: { limitOrderId?: string } = {}) => {
      if (limitOrderId) {
        requestNotificationLimitOrder(limitOrderId);
      }

      const ordersIndex = walletOrdersTabIndex;
      if (!shouldDeepLinkToOrdersTab || ordersIndex === undefined) {
        clearWalletOrdersDeepLinkPending();
        return;
      }

      setIsOrdersDeepLinkInProgress(true);
      deepLinkInProgressRef.current = true;
      userInteractedRef.current = true;
      lastSettledIndexRef.current = ordersIndex;
      settledAtTargetRef.current = false;
      setPendingOrdersTab(false);
      setSelectedIndex(ordersIndex);
      resetWalletHomeScrollToTop();

      forcingInitialPageRef.current = true;
      pagerRef.current?.setPageWithoutAnimation(ordersIndex, 'tab-click');

      requestAnimationFrame(() => {
        forcingInitialPageRef.current = false;
        deepLinkInProgressRef.current = false;
        setIsOrdersDeepLinkInProgress(false);
        clearWalletOrdersDeepLinkPending();
      });
    },
    [
      requestNotificationLimitOrder,
      resetWalletHomeScrollToTop,
      shouldDeepLinkToOrdersTab,
      walletOrdersTabIndex,
    ],
  );

  React.useEffect(() => {
    registerWalletHomeDeepLinkHandler(navigateToOrdersTabDeepLink);
    return () => registerWalletHomeDeepLinkHandler(null);
  }, [navigateToOrdersTabDeepLink]);

  React.useEffect(() => {
    if (initialTab === 'orders' || initialLimitOrderId) {
      navigateToOrdersTabDeepLink({ limitOrderId: initialLimitOrderId });
    }
  }, [initialLimitOrderId, initialTab, navigateToOrdersTabDeepLink]);

  // Remap the settled tab when Orders visibility changes so pager indices stay
  // aligned (History is index 3 without Orders, index 4 with Orders).
  React.useLayoutEffect(() => {
    const previouslyShowedWalletOrdersTab = prevShowWalletOrdersTabRef.current;
    if (previouslyShowedWalletOrdersTab === showWalletOrdersTab) {
      return;
    }

    prevShowWalletOrdersTabRef.current = showWalletOrdersTab;

    const mappedIndex = mapWalletTabIndexForOrdersVisibilityChange(
      lastSettledIndexRef.current,
      showWalletOrdersTab,
      previouslyShowedWalletOrdersTab,
    );

    lastSettledIndexRef.current = mappedIndex;
    settledAtTargetRef.current = false;
    setSelectedIndex(mappedIndex);

    const id = requestAnimationFrame(() => {
      forcingInitialPageRef.current = true;
      pagerRef.current?.setPageWithoutAnimation(mappedIndex, 'tab-click');
      setTimeout(() => {
        forcingInitialPageRef.current = false;
      }, 0);
    });

    return () => cancelAnimationFrame(id);
  }, [showWalletOrdersTab]);

  const onPageSelecting = React.useCallback(
    (index: number, reason: 'swipe' | 'tab-click') => {
      // Ignore spurious mount-time swipe events on Android before the user
      // interacts. Tab taps must always pass through — blocking them here
      // prevented the Orders tab (and any non-default tab) from working.
      // Real swipes are also captured via `onPageScrollStateChanged ===
      // 'dragging'`.
      if (
        Platform.OS === 'android' &&
        reason === 'swipe' &&
        !userInteractedRef.current &&
        !forcingInitialPageRef.current &&
        index !== pagerInitialPage
      ) {
        return;
      }
      if (reason === 'tab-click' && !forcingInitialPageRef.current) {
        userInteractedRef.current = true;
        lastSettledIndexRef.current = index;
        setPendingOrdersTab(false);
      } else if (
        reason === 'swipe' &&
        userInteractedRef.current &&
        !forcingInitialPageRef.current
      ) {
        lastSettledIndexRef.current = index;
      }
      if (!forcingInitialPageRef.current && !deepLinkInProgressRef.current) {
        setSelectedIndex(index);
      }
    },
    [pagerInitialPage],
  );

  const onPageScrollStateChanged = React.useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      if (state === 'dragging') {
        userDraggingRef.current = true;
        // Ignore mount-time drag noise while an Orders deep link is still
        // pending — clearing here would cancel navigation to Orders.
        if (!pendingOrdersTab && !deepLinkInProgressRef.current) {
          userInteractedRef.current = true;
        }
      }
    },
    [pendingOrdersTab],
  );
  const onPageSelected = React.useCallback(
    (index: number) => {
      const wasUserDragging = userDraggingRef.current;
      userDraggingRef.current = false;

      if (Platform.OS === 'android') {
        if (!userInteractedRef.current) {
          if (index !== pagerInitialPage) {
            forcingInitialPageRef.current = true;
            pagerRef.current?.setPageWithoutAnimation(
              pagerInitialPage,
              'tab-click',
            );
            setTimeout(() => {
              forcingInitialPageRef.current = false;
            }, 0);
            return;
          }
          settledAtTargetRef.current = true;
        } else if (
          !forcingInitialPageRef.current &&
          index === 0 &&
          lastSettledIndexRef.current !== 0 &&
          !wasUserDragging
        ) {
          // Spurious page-0 native event — the native pager may have drifted
          // to Tokens while JS state still reflects the user's settled tab.
          forcingInitialPageRef.current = true;
          pagerRef.current?.setPageWithoutAnimation(
            lastSettledIndexRef.current,
            'tab-click',
          );
          setTimeout(() => {
            forcingInitialPageRef.current = false;
          }, 0);
          return;
        }
      }
      // Only record this as the user's settled choice if they actually
      // drove the change (real swipe or tap). Spurious native events
      // during blur/focus re-attach must not overwrite the restore target.
      if (userInteractedRef.current && !forcingInitialPageRef.current) {
        lastSettledIndexRef.current = index;
        setSelectedIndex(index);
      }
    },
    [pagerInitialPage],
  );

  // Open the notification order modal only after landing on Orders (when
  // applicable) so we don't show it over Tokens/History.
  React.useEffect(() => {
    if (!pendingNotificationOrder) {
      return;
    }

    if (!shouldDeepLinkToOrdersTab || walletOrdersTabIndex === undefined) {
      setNotificationLimitOrder(pendingNotificationOrder);
      setPendingNotificationOrder(null);
      return;
    }

    if (
      lastSettledIndexRef.current === walletOrdersTabIndex &&
      !isOrdersDeepLinkInProgress
    ) {
      setNotificationLimitOrder(pendingNotificationOrder);
      setPendingNotificationOrder(null);
    }
  }, [
    isOrdersDeepLinkInProgress,
    pendingNotificationOrder,
    shouldDeepLinkToOrdersTab,
    walletOrdersTabIndex,
  ]);

  // When review mode activates, force back to the only available tab.
  React.useEffect(() => {
    if (!applyLimitedFunctionality) {
      return;
    }
    setPendingOrdersTab(false);
    lastSettledIndexRef.current = 0;
    settledAtTargetRef.current = false;
    setSelectedIndex(0);
    const id = requestAnimationFrame(() => {
      forcingInitialPageRef.current = true;
      pagerRef.current?.setPageWithoutAnimation(0, 'tab-click');
      setTimeout(() => {
        forcingInitialPageRef.current = false;
      }, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [applyLimitedFunctionality]);

  // Android pager-view ignores `initialPage` and emits spurious page-0
  // events during mount/layout that can land after the corrective snap.
  // Run a short watchdog that re-forces the target every 100ms until we
  // observe the pager actually settled at the target (or the user touches
  // the pager). Stops after ~1s regardless so it can't fight real input.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const guardPage = applyLimitedFunctionality ? 0 : pagerInitialPage;
    settledAtTargetRef.current = false;
    let attempts = 0;
    const interval = setInterval(() => {
      if (
        settledAtTargetRef.current ||
        userInteractedRef.current ||
        attempts >= 10
      ) {
        clearInterval(interval);
        return;
      }
      attempts += 1;
      forcingInitialPageRef.current = true;
      pagerRef.current?.setPageWithoutAnimation(guardPage, 'tab-click');
      setTimeout(() => {
        forcingInitialPageRef.current = false;
      }, 0);
    }, 100);
    return () => clearInterval(interval);
  }, [applyLimitedFunctionality, pagerInitialPage]);

  // After a blur/focus roundtrip through another bottom tab (with
  // `freezeOnBlur` + `detachInactiveScreens={false}`), iOS
  // UIPageViewController can silently revert to its initialPage while JS
  // state for the tab bar persists -- leaving the strip showing e.g.
  // "History" but the content stuck on "Tokens". On every refocus, defer to
  // the next frame so the native view is re-attached, then force the native
  // pager AND JS `selectedIndex` back to whatever sub-tab the user last
  // settled on (tracked separately so spurious native events during the
  // blur/focus cycle don't poison the restore target).
  useFocusEffect(
    React.useCallback(() => {
      const id = requestAnimationFrame(() => {
        if (
          deepLinkInProgressRef.current ||
          shouldSuppressWalletHomeFocusResync()
        ) {
          return;
        }
        const desired = lastSettledIndexRef.current;
        forcingInitialPageRef.current = true;
        pagerRef.current?.setPageWithoutAnimation(desired, 'tab-click');
        // Re-assert parent state too in case it drifted during the
        // blur/focus cycle (the spurious-onPageSelected case).
        setSelectedIndex(desired);
        setTimeout(() => {
          forcingInitialPageRef.current = false;
        }, 0);
      });
      return () => cancelAnimationFrame(id);
    }, []),
  );

  // Also intercept the explicit Wallet bottom-tab press: when the user
  // re-presses the already-focused Wallet tab, no focus transition fires,
  // but if a desync slipped through, this is the user's only escape hatch.
  // Reuse the same resync path.
  const navigation = useNavigation();
  React.useEffect(() => {
    const tabNav = navigation.getParent();
    if (!tabNav) return;

    const unsubscribe = tabNav.addListener(
      // @ts-expect-error - `tabPress` exists on the BottomTab navigator but
      // isn't on the generic NavigationProp type returned by getParent().
      'tabPress',
      (event: { target?: string }) => {
        const state = tabNav.getState?.();
        const walletRoute = state?.routes?.find(
          (r: { name: string }) => r.name === 'WalletTab',
        );
        if (!walletRoute) return;
        if (event?.target !== undefined && event.target !== walletRoute.key) {
          return;
        }
        requestAnimationFrame(() => {
          if (
            deepLinkInProgressRef.current ||
            shouldSuppressWalletHomeFocusResync()
          ) {
            return;
          }
          const desired = lastSettledIndexRef.current;
          forcingInitialPageRef.current = true;
          pagerRef.current?.setPageWithoutAnimation(desired, 'tab-click');
          setSelectedIndex(desired);
          setTimeout(() => {
            forcingInitialPageRef.current = false;
          }, 0);
        });
      },
    );

    return unsubscribe;
  }, [navigation]);

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <WalletTabs
          onSelect={props.onSelect}
          selectedPage={props.selectedPage}
          onPressSelected={onPageSelected}
          scrollOffset={scrollOffset}
          tabBarHeight={tabBarHeight}
          headerHeight={headerHeight}
          progress={progress}
          showWalletOrdersTab={showWalletOrdersTab}
          walletHistoryTabIndex={walletHistoryTabIndex}
          walletOrdersTabIndex={walletOrdersTabIndex}
        />
      );
    },
    [
      onPageSelected,
      scrollOffset,
      tabBarHeight,
      headerHeight,
      progress,
      showWalletOrdersTab,
      walletHistoryTabIndex,
      walletOrdersTabIndex,
    ],
  );

  const renderHeader = React.useCallback(() => {
    return (
      <WalletHomeOverview
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        refreshing={isRefreshing}
        progress={progress}
        reviewMode={applyLimitedFunctionality}
        belowHeaderSlot={<WalletLinksCarousel />}
      />
    );
  }, [
    scrollOffset,
    headerHeight,
    isRefreshing,
    progress,
    applyLimitedFunctionality,
  ]);

  const containerComponent = React.useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <View style={[t.absolute, t.flex1, t.hFull, t.wFull]}>{children}</View>
      );
    },
    [t.absolute, t.flex1, t.hFull, t.wFull],
  );

  const walletPagerPages = React.useMemo(() => {
    const pages = [
      <WalletHomeTokens
        key="wallet-home-tokens"
        enabled={selectedIndex === 0}
        onScroll={scrollHandler}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        headerGapHeight={headerGapHeight}
        setIsRefreshing={setIsRefreshing}
        usdcLendingLearnMore={usdcLendingLearnMore}
      />,
      <WalletHomePulse
        key="wallet-home-pulse"
        enabled={selectedIndex === 1}
        onScroll={scrollHandler}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        headerGapHeight={headerGapHeight}
        setIsRefreshing={setIsRefreshing}
      />,
      <WalletHomeCollectibles
        key="wallet-home-collectibles"
        enabled={selectedIndex === WALLET_TAB_COLLECTIBLES}
        onScroll={scrollHandler}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        headerGapHeight={headerGapHeight}
        setIsRefreshing={setIsRefreshing}
      />,
    ];

    if (showWalletOrdersTab && walletOrdersTabIndex !== undefined) {
      pages.push(
        <WalletHomeOrders
          key="wallet-home-orders"
          enabled={selectedIndex === walletOrdersTabIndex}
          listRef={ordersListRef}
          dismissSelectedOrderRef={dismissOrdersListSelectedOrderRef}
          onScroll={scrollHandler}
          scrollOffset={scrollOffset}
          headerHeight={headerHeight}
          tabBarHeight={tabBarHeight}
          headerGapHeight={headerGapHeight}
          setIsRefreshing={setIsRefreshing}
          onSeeAllFills={handleSeeAllLimitOrderFills}
        />,
      );
    }

    pages.push(
      <WalletHomeHistory
        key="wallet-home-history"
        enabled={selectedIndex === walletHistoryTabIndex}
        onScroll={scrollHandler}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        headerGapHeight={headerGapHeight}
        setIsRefreshing={setIsRefreshing}
      />,
    );

    return pages;
  }, [
    handleSeeAllLimitOrderFills,
    headerGapHeight,
    headerHeight,
    scrollHandler,
    scrollOffset,
    selectedIndex,
    setIsRefreshing,
    showWalletOrdersTab,
    tabBarHeight,
    usdcLendingLearnMore,
    walletHistoryTabIndex,
    walletOrdersTabIndex,
  ]);

  const PagerComponent = React.useMemo(() => {
    if (applyLimitedFunctionality) {
      return (
        <Pager
          key={'wallet-pager-review'}
          ref={pagerRef}
          initialPage={0}
          onPageSelecting={onPageSelecting}
          onPageSelected={onPageSelected}
          onPageScrollStateChanged={onPageScrollStateChanged}
          renderTabBar={renderTabBar}
          renderHeader={renderHeader}
          containerComponent={containerComponent}
        >
          <WalletHomeTokens
            enabled
            onScroll={scrollHandler}
            scrollOffset={scrollOffset}
            headerHeight={headerHeight}
            tabBarHeight={tabBarHeight}
            headerGapHeight={headerGapHeight}
            setIsRefreshing={setIsRefreshing}
            usdcLendingLearnMore={usdcLendingLearnMore}
          />
        </Pager>
      );
    }

    return (
      <Pager
        key={
          showWalletOrdersTab
            ? 'wallet-pager-full-with-orders'
            : 'wallet-pager-full-no-orders'
        }
        ref={pagerRef}
        initialPage={pagerInitialPage}
        onPageSelecting={onPageSelecting}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
        renderTabBar={renderTabBar}
        renderHeader={renderHeader}
        containerComponent={containerComponent}
      >
        {walletPagerPages}
      </Pager>
    );
  }, [
    applyLimitedFunctionality,
    containerComponent,
    headerGapHeight,
    headerHeight,
    onPageSelected,
    onPageSelecting,
    onPageScrollStateChanged,
    pagerInitialPage,
    renderHeader,
    renderTabBar,
    scrollHandler,
    scrollOffset,
    setIsRefreshing,
    showWalletOrdersTab,
    tabBarHeight,
    usdcLendingLearnMore,
    walletPagerPages,
  ]);

  return (
    <View style={[t.flex1]}>
      <WalletHomeNuxBackground progress={progress} />
      <WalletHomeHeader
        scrollOffset={scrollOffset}
        onAvatarPress={openDrawer}
        onSearchPress={() => handleSetSearchQuery('')}
      />
      {PagerComponent}
      <WalletHomeSearch
        searchQuery={searchQuery}
        onChangeText={handleSetSearchQuery}
        onClose={() => handleSetSearchQuery(null)}
      />
      {searchQuery === null && (
        <View style={[t.absolute, t.bottom0, t.right0]}>
          <FloatingComposerButton />
        </View>
      )}
      {notificationLimitOrder ? (
        <WalletOrderDetailModal
          order={notificationLimitOrder}
          onDismiss={() => setNotificationLimitOrder(null)}
          onSeeAllFills={handleSeeAllLimitOrderFills}
        />
      ) : null}
    </View>
  );
}

function WalletTabs({
  onSelect,
  selectedPage,
  onPressSelected,
  scrollOffset,
  tabBarHeight,
  headerHeight,
  progress,
  showWalletOrdersTab,
  walletHistoryTabIndex,
  walletOrdersTabIndex,
}: {
  onSelect?: (index: number) => void;
  selectedPage: number;
  onPressSelected: (index: number) => void;
  scrollOffset: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerHeight: SharedValue<number>;
  progress: SharedValue<number>;
  showWalletOrdersTab: boolean;
  walletHistoryTabIndex: number;
  walletOrdersTabIndex: number | undefined;
}) {
  const { checkUserAppContextGate } = useUserAppContextGate();

  const applyLimitedFunctionality =
    !checkUserAppContextGate('wallet-intents').value;

  const t = useTheme();

  const onPressItem = React.useCallback(
    (index: number) => {
      onSelect?.(index);
      if (index === selectedPage) {
        onPressSelected?.(index);
      }
    },
    [onSelect, selectedPage, onPressSelected],
  );

  const tabsStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        { translateY: -Math.min(scrollOffset.value, headerHeight.value) },
      ],
    };
  });

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        tabBarHeight.value = height;
      }
    },
    [tabBarHeight],
  );

  if (applyLimitedFunctionality) {
    return null;
  }

  return (
    <Animated.View
      style={[
        t.flexRow,
        t.pX3,
        t.bgDefault,
        { paddingBottom: 6, gap: 12, zIndex: 11 },
        tabsStyle,
      ]}
      onLayout={onLayout}
    >
      <AnimatedPressable onPress={() => onPressItem(0)}>
        <Text2
          weight="semibold"
          size="lg"
          color={selectedPage === 0 ? 'primary' : 'tertiary'}
        >
          Tokens
        </Text2>
      </AnimatedPressable>
      <AnimatedPressable onPress={() => onPressItem(1)}>
        <Text2
          weight="semibold"
          size="lg"
          color={selectedPage === 1 ? 'primary' : 'tertiary'}
        >
          Pulse
        </Text2>
      </AnimatedPressable>
      {!applyLimitedFunctionality && (
        <AnimatedPressable onPress={() => onPressItem(2)}>
          <Text2
            weight="semibold"
            size="lg"
            color={selectedPage === 2 ? 'primary' : 'tertiary'}
          >
            Collectibles
          </Text2>
        </AnimatedPressable>
      )}
      {!applyLimitedFunctionality &&
      showWalletOrdersTab &&
      walletOrdersTabIndex !== undefined ? (
        <AnimatedPressable onPress={() => onPressItem(walletOrdersTabIndex)}>
          <Text2
            weight="semibold"
            size="lg"
            color={
              selectedPage === walletOrdersTabIndex ? 'primary' : 'tertiary'
            }
          >
            Orders
          </Text2>
        </AnimatedPressable>
      ) : null}
      <AnimatedPressable onPress={() => onPressItem(walletHistoryTabIndex)}>
        <Text2
          weight="semibold"
          size="lg"
          color={
            selectedPage === walletHistoryTabIndex ? 'primary' : 'tertiary'
          }
        >
          History
        </Text2>
      </AnimatedPressable>
    </Animated.View>
  );
}

function WalletHomeTokens({
  enabled,
  onScroll,
  scrollOffset,
  headerHeight,
  tabBarHeight,
  headerGapHeight,
  setIsRefreshing,
  usdcLendingLearnMore,
}: {
  enabled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerGapHeight: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
  usdcLendingLearnMore?: boolean;
}) {
  const t = useTheme();
  const extraData = useCommonFlatListExtraData();

  const { checkUserAppContextGate } = useUserAppContextGate();
  const usdcLendingEnabled = checkUserAppContextGate('wallet-intents').value;

  const [showManageTokens, setShowManageTokens] = React.useState(false);
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasLaidOut(false);
    }
  }, [enabled]);
  const panHandlerEnabled = Platform.select({ default: false, ios: true });
  const { height: windowHeight } = useWindowDimensions();
  const bottomSheetContentContainerStyle = React.useMemo(
    () => [{ height: windowHeight * 0.75 }],
    [windowHeight],
  );

  const effectiveHeaderGap = getEffectiveHeaderGap(headerGapHeight);

  const ListHeaderComponent = React.useMemo(() => {
    if (!usdcLendingEnabled) {
      return (
        <View>
          <WalletTabHeaderGap height={effectiveHeaderGap} />
        </View>
      );
    }

    return (
      <View>
        <WalletTabHeaderGap height={effectiveHeaderGap} />
        <Text2
          weight="semibold"
          color="primary"
          size="lg"
          style={[t.pX3, { paddingVertical: 6 }]}
        >
          Cash Balance
        </Text2>
        <USDCBalances showUsdcLendingLearnMore={usdcLendingLearnMore} />
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX3,
            t.pT3,
            { paddingVertical: 6 },
          ]}
        >
          <Text2 weight="semibold" color="primary" size="lg">
            Other Balances
          </Text2>
          <AnimatedPressable onPress={() => setShowManageTokens(true)}>
            <Eye size={18} color={t.colors.text.secondary} />
          </AnimatedPressable>
        </View>
      </View>
    );
  }, [t, effectiveHeaderGap, usdcLendingEnabled, usdcLendingLearnMore]);

  const insets = useSafeAreaInsets();

  const contentOffset = React.useMemo(() => {
    if (!enabled || !hasLaidOut) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, enabled, hasLaidOut]);

  const disabledStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - tabBarHeight.value,
          ),
        },
      ],
    };
  });

  if (!enabled) {
    return (
      <Animated.View style={[disabledStyle]}>
        {ListHeaderComponent}
        {Array.from({ length: 5 }).map((_, index) => (
          <TokenListItemPlaceholder key={index} />
        ))}
      </Animated.View>
    );
  }

  return (
    <>
      <WalletTokenBalances
        onScroll={onScroll}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
        extraData={extraData}
        ListHeaderComponent={ListHeaderComponent}
        contentOffset={contentOffset}
        setIsRefreshing={setIsRefreshing}
        showVerticalScrollIndicator={false}
        hideUsdc={usdcLendingEnabled}
      />
      {showManageTokens && (
        <AutoDisplayingBottomSheetModal
          name="wallet-manage-tokens"
          onDismiss={() => setShowManageTokens(false)}
          contentContainerStyle={bottomSheetContentContainerStyle}
          enablePanDownToClose={panHandlerEnabled}
          enableHandlePanningGesture={panHandlerEnabled}
          enableContentPanningGesture={panHandlerEnabled}
        >
          <ManageTokens />
        </AutoDisplayingBottomSheetModal>
      )}
    </>
  );
}

function WalletHomeCollectibles({
  enabled,
  onScroll,
  scrollOffset,
  headerHeight,
  tabBarHeight,
  headerGapHeight,
  setIsRefreshing,
}: {
  enabled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerGapHeight: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
}) {
  const t = useTheme();
  const push = usePush();
  const { width: screenWidth } = useWindowDimensions();
  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasLaidOut(false);
    }
  }, [enabled]);

  const effectiveHeaderGap = getEffectiveHeaderGap(headerGapHeight);

  const ListHeaderComponent = React.useMemo(() => {
    return <WalletTabHeaderGap height={effectiveHeaderGap} />;
  }, [effectiveHeaderGap]);

  const insets = useSafeAreaInsets();

  const contentOffset = React.useMemo(() => {
    if (!enabled || !hasLaidOut) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, enabled, hasLaidOut]);

  const onCollectiblePress = React.useCallback(
    (data: ApiEthNonFungibleToken) => {
      try {
        if (
          data.chain === 'base' &&
          isAddressEqual(
            '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
            data.contractAddress as Hex,
          )
        ) {
          push('CollectibleCast', {
            castHash: '0x' + BigInt(data.tokenId).toString(16),
          });
          return;
        }
      } catch {
        // no-op
      }
      push('Collectible', { data });
    },
    [push],
  );

  const disabledStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - tabBarHeight.value,
          ),
        },
      ],
    };
  });

  if (!enabled) {
    const NUM_VISIBLE_ROWS = 6;
    const COLLECTIONS_COLUMN_COUNT = 3;
    const imageSize =
      (screenWidth - SPACING * (COLLECTIONS_COLUMN_COUNT + 1)) /
      COLLECTIONS_COLUMN_COUNT;

    return (
      <Animated.View style={[t.pT3, disabledStyle]}>
        {ListHeaderComponent}
        <WalletCollectiblesItemsPlaceholder
          imageSize={imageSize}
          columns={COLLECTIONS_COLUMN_COUNT}
          rows={NUM_VISIBLE_ROWS}
        />
      </Animated.View>
    );
  }

  return (
    <WalletCollectibles
      onCollectiblePress={onCollectiblePress}
      onScroll={onScroll}
      onLayout={() => {
        if (!hasLaidOut) {
          setHasLaidOut(true);
        }
      }}
      extraData={extraData}
      ListHeaderComponent={ListHeaderComponent}
      contentOffset={contentOffset}
      setIsRefreshing={setIsRefreshing}
      showVerticalScrollIndicator={false}
    />
  );
}

function WalletHomeHistory({
  enabled,
  onScroll,
  scrollOffset,
  headerHeight,
  tabBarHeight,
  headerGapHeight,
  setIsRefreshing,
}: {
  enabled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerGapHeight: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
}) {
  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasLaidOut(false);
    }
  }, [enabled]);

  const effectiveHeaderGap = getEffectiveHeaderGap(headerGapHeight);

  const ListHeaderComponent = React.useMemo(() => {
    return <WalletTabHeaderGap height={effectiveHeaderGap} />;
  }, [effectiveHeaderGap]);

  const insets = useSafeAreaInsets();

  const contentOffset = React.useMemo(() => {
    if (!enabled || !hasLaidOut) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, enabled, hasLaidOut]);

  const launchFrame = useLaunchFrame();
  const pushToUserProfile = usePushToUserProfile();

  const handleUserPress = React.useCallback(
    ({ fid }: { fid: number }) => {
      pushToUserProfile({ fid });
    },
    [pushToUserProfile],
  );

  const disabledStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - tabBarHeight.value,
          ),
        },
      ],
    };
  });

  if (!enabled) {
    return (
      <Animated.View style={[disabledStyle]}>
        {ListHeaderComponent}
        {Array.from({ length: 5 }).map((_, index) => (
          <TokenListItemPlaceholder key={index} />
        ))}
      </Animated.View>
    );
  }

  return (
    <WalletActivityV2
      onUserPress={handleUserPress}
      onLaunchFrame={launchFrame}
      onScroll={onScroll}
      onLayout={() => {
        if (!hasLaidOut) {
          setHasLaidOut(true);
        }
      }}
      extraData={extraData}
      ListHeaderComponent={ListHeaderComponent}
      contentOffset={contentOffset}
      setIsRefreshing={setIsRefreshing}
      showVerticalScrollIndicator={false}
    />
  );
}

function WalletHomeOrders({
  enabled,
  listRef,
  dismissSelectedOrderRef,
  onScroll,
  scrollOffset,
  headerHeight,
  tabBarHeight,
  headerGapHeight,
  setIsRefreshing,
  onSeeAllFills,
}: {
  enabled: boolean;
  listRef: React.RefObject<FlatList<ApiLimitOrder> | null>;
  dismissSelectedOrderRef: React.MutableRefObject<(() => void) | null>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerGapHeight: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
  onSeeAllFills: (order: ApiLimitOrder) => void;
}) {
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasLaidOut(false);
    }
  }, [enabled]);

  const effectiveHeaderGap = getEffectiveHeaderGap(headerGapHeight);

  const ListHeaderComponent = React.useMemo(() => {
    return <WalletTabHeaderGap height={effectiveHeaderGap} />;
  }, [effectiveHeaderGap]);

  const insets = useSafeAreaInsets();

  const contentOffset = React.useMemo(() => {
    if (!enabled || !hasLaidOut) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, enabled, hasLaidOut]);

  const disabledStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - tabBarHeight.value,
          ),
        },
      ],
    };
  });

  if (!enabled) {
    return (
      <Animated.View style={[disabledStyle]}>
        {ListHeaderComponent}
      </Animated.View>
    );
  }

  return (
    <WalletOrdersList
      listRef={listRef}
      dismissSelectedOrderRef={dismissSelectedOrderRef}
      onScroll={onScroll}
      onLayout={() => {
        if (!hasLaidOut) {
          setHasLaidOut(true);
        }
      }}
      ListHeaderComponent={ListHeaderComponent}
      contentOffset={contentOffset}
      setIsRefreshing={setIsRefreshing}
      onSeeAllFills={onSeeAllFills}
    />
  );
}

function WalletHomePulse({
  enabled,
  onScroll,
  scrollOffset,
  headerHeight,
  tabBarHeight,
  headerGapHeight,
  setIsRefreshing: _setIsRefreshing,
}: {
  enabled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  headerGapHeight: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
}) {
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasLaidOut(false);
    }
  }, [enabled]);

  const effectiveHeaderGap = getEffectiveHeaderGap(headerGapHeight);

  const headerGap = React.useMemo(
    () => <WalletTabHeaderGap height={effectiveHeaderGap} />,
    [effectiveHeaderGap],
  );

  const insets = useSafeAreaInsets();

  const contentOffset = React.useMemo(() => {
    if (!enabled || !hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, enabled, hasLaidOut]);

  const disabledStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - tabBarHeight.value,
          ),
        },
      ],
    };
  });

  if (!enabled) {
    return <Animated.View style={[disabledStyle]}>{headerGap}</Animated.View>;
  }

  return (
    <PulseFeed
      embedded
      ListHeaderPrepend={headerGap}
      onScroll={onScroll}
      onLayout={() => {
        if (!hasLaidOut) {
          setHasLaidOut(true);
        }
      }}
      contentOffset={contentOffset}
    />
  );
}

function WalletTabHeaderGap({ height = 0 }: { height: number }) {
  return <View style={{ height }} />;
}
