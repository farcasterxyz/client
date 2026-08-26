import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  EventingProvider,
  FeedItemType,
  MixedFeedItem,
  useChannelFeedUnseenStatus,
  useMixedFeedItems,
  useTrackEvent,
  useUnseen,
} from 'farcaster-client-hooks';
import { AtomsButton, useDefaultToastProviderProps } from 'farcaster-expo';
import React, {
  FC,
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  AppStateStatus,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { ToastProvider, useToast } from 'react-native-toast-notifications';

import { posthogClient } from '~/analyticsClient/providers/posthogProvider';
import { CastFeedItem } from '~/components/CastFeedItem';
import { FeedItemErrorBoundary } from '~/components/FeedItemErrorBoundary';
import { LoadFailureIndicator } from '~/components/LoadFailureIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { UserRecommendations } from '~/components/recommendations/UserRecommendations';
import { Text } from '~/components/Text';
import { CastActionErrorToast } from '~/components/toasts/CastActionErrorToast';
import { CastActionToast } from '~/components/toasts/CastActionToast';
import { CastBookmarkedToast } from '~/components/toasts/CastBookmarkedToast';
import { CastBookmarkRemovedToast } from '~/components/toasts/CastBookmarkRemovedToast';
import { GenericToast } from '~/components/toasts/GenericToast';
import { ShareSheetCopyToClipboardToast } from '~/components/toasts/ShareSheetCopyToClipboardToast';
import { ShareSheetDirectCastsToast } from '~/components/toasts/ShareSheetDirectCastsToast';
import { TrendingTopicsList } from '~/components/TrendingTopics/TrendingTopics';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useAppState } from '~/hooks/useAppState';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { usePrefetchCollectibleImagesOnView } from '~/hooks/usePrefetchCollectibleImagesOnView';
import { usePrefetchFeedItemCastOnView } from '~/hooks/usePrefetchFeedItemCastOnView';
import { useRecordCastFeedItemOnView } from '~/hooks/useRecordCastFeedItemOnView';
import { useScrollToTopWithOffset } from '~/hooks/useScrollToTopWithOffset';
import { ResultReturnedNullError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  extractMixedFeedItemKey,
  getMixedFeedItemType,
} from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  openFollowingFeedSession,
  scheduleBackgroundFollowingFeedSessionClose,
  scheduleFollowingFeedSessionClose,
} from '~/utils/FollowingFeedSessionTracking';
import {
  openHomeFeedSession,
  scheduleBackgroundHomeFeedSessionClose,
  scheduleHomeFeedSessionClose,
} from '~/utils/HomeFeedSessionTracking';

import {
  listenResetFeedShellState,
  useHeaderOffset,
  useSetMinimalShellMode,
} from './HomeScreenScrollHandlers';

const LIST_BATCH_SIZE = 10;
const SCROLL_DEBOUNCE_MS = 50;
const REVERSE_CHRON_SORT_MODE = { type: 'reverse-chron' } as const;

// Number of top visible cast items to synthesize cast-view events for right
// before each home-feed PTR. The home ranker re-ranks based on view signals;
// when the user pulls without scrolling, the in-memory event buffer is empty
// and the backend has nothing to react to → returns the same ranking. Pushing
// view events for what's actually on screen guarantees the request carries
// fresh signal. The InternalEventingProvider dedups by cast hash, so this is
// a no-op when organic viewability has already recorded the same items.
const HOME_PTR_SYNTHESIZE_TOP_N = 3;
const HOME_PTR_FEATURE_FLAGS_REFRESH_COOLDOWN_MS = 60 * 1000;

let lastHomePtrFeatureFlagsRefreshAt = 0;

function refreshFeatureFlagsAfterHomeFeedPullToRefresh() {
  const now = Date.now();
  if (
    now - lastHomePtrFeatureFlagsRefreshAt <
    HOME_PTR_FEATURE_FLAGS_REFRESH_COOLDOWN_MS
  ) {
    return;
  }

  lastHomePtrFeatureFlagsRefreshAt = now;
  posthogClient.reloadFeatureFlags();
}

// TODO: Bring back legend list once we hav time to figure out why top items in feed
// is not getting the callback of "viewed" as we would expect.
// const AnimatedLegendList = Animated.createAnimatedComponent(
//   LegendList<MixedFeedItem>,
// );

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList<MixedFeedItem>,
);

function FeedLoadingIndicator({ headerHeight }: { headerHeight?: number }) {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        t.flexCol,
        t.itemsCenter,
        { marginTop: (headerHeight || 0) + 14, gap: 12 },
      ]}
    >
      <LoadingIndicator />
    </View>
  );
}

interface FeedProps {
  feedKey: string;
  feedType: string;
  showCastSourceLabels?: boolean; // ignored for home feed
  showChannelTag?: boolean; // ignored for home feed
  banner?: React.ReactElement;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPullToRefresh?: () => void;
  headerHeight?: number;
  goToRecent?: () => void;
  enabled?: boolean;
  filterPinnedItems?: boolean;
  headerTransform?: object;
  /** Whether this feed is the currently selected PagerView tab.
   *  Used to suppress viewability tracking (cast views, prefetch, video
   *  autoplay) for non-visible tabs, reducing JS thread work during
   *  horizontal tab swiping. */
  isSelectedTab?: boolean;
  /** Tracks whether PagerView is currently being swiped. Viewability callbacks
   *  read this ref directly so swipe state changes do not re-render feeds. */
  isPagerSwipingRef?: React.RefObject<boolean>;
}

const Feed: FC<FeedProps> = memo(
  ({ headerHeight, headerTransform, ...props }) => {
    const t = useTheme();

    const defaultToastProps = useDefaultToastProviderProps();

    return (
      <View style={[t.relative, t.hFull]}>
        <ToastProvider
          {...defaultToastProps}
          placement="top"
          offsetTop={Math.floor(headerHeight ?? 0) + sizes.s3}
          // Swipe doesn't work because the tabs also swipe
          swipeEnabled={false}
          renderType={{
            shareSheetCopyToClipboard: () => <ShareSheetCopyToClipboardToast />,
            shareSheetDirectCasts: (toast) => (
              <ShareSheetDirectCastsToast {...toast} />
            ),
            castBookmarked: (toast) => <CastBookmarkedToast {...toast} />,
            castBookmarkRemoved: () => <CastBookmarkRemovedToast />,
            castAction: (toast) => <CastActionToast {...toast} />,
            castActionError: (toast) => <CastActionErrorToast {...toast} />,
            generic: (toast) => <GenericToast {...toast} />,
            refreshFeed: (toast) => (
              <Animated.View style={[t.absolute, headerTransform]}>
                <Pressable
                  onPress={() => toast.onPress && toast.onPress(toast.id)}
                >
                  <View
                    style={[
                      t.bgAction,
                      t.flexRow,
                      t.justifyCenter,
                      t.itemsCenter,
                      t.shadowMd,
                      t.p2,
                      t.pX4,
                      {
                        borderRadius: 20,
                      },
                      {
                        shadowColor: t.colors.text.dark,
                        shadowOpacity: 0.3,
                        shadowOffset: { width: 1, height: 1 },
                        shadowRadius: 2,
                      },
                    ]}
                  >
                    <Ionicons
                      name="arrow-up-outline"
                      style={[
                        { color: t.colors.text.light },
                        t.alignCenter,
                        t.mR2,
                        {
                          fontSize: 18,
                        },
                      ]}
                    />
                    <Text style={[t.texts.light, t.textSm, t.pR1]}>
                      {toast.message}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ),
          }}
        >
          {props.enabled ? (
            <EventingProvider channel={props.feedKey} feed={props.feedType}>
              <FeedContent headerHeight={headerHeight} {...props} />
            </EventingProvider>
          ) : (
            <FeedLoadingIndicator headerHeight={headerHeight} />
          )}
        </ToastProvider>
      </View>
    );
  },
);

Feed.displayName = 'Feed';

const EMPTY_VIEWABILITY_PAIRS: React.ComponentProps<
  typeof FlashList
>['viewabilityConfigCallbackPairs'] = [];

const FeedContent: FC<FeedProps> = memo((props) => {
  const {
    feedKey,
    feedType,
    showCastSourceLabels,
    showChannelTag,
    banner,
    headerHeight,
    onScroll,
    onPullToRefresh,
    isSelectedTab = true,
    isPagerSwipingRef,
  } = props;

  const isHome = useMemo(() => feedKey === 'home', [feedKey]);
  const isFollowing = useMemo(() => feedKey === 'following', [feedKey]);

  const t = useTheme();
  const navigate = useNavigate();
  const { trackEvent, trackCastView } = useTrackEvent();
  const appState = useAppState();
  const isFocused = useIsFocused();
  const extraData = useCommonFlatListExtraData();

  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();

  const onNullFeedItemsResponse = useCallback(() => {
    trackError(
      new ResultReturnedNullError({
        screenOrProviderId: 'FeedContent',
      }),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isHome && isSelectedTab) {
        trackEvent(AnalyticsEvent.ViewChannel, {
          channel: feedKey,
          'feed type': feedType === 'curated' ? 'trending' : 'recent',
        });
      }
    }, [isHome, isSelectedTab, trackEvent, feedKey, feedType]),
  );

  useEffect(() => {
    if (!isHome) {
      return;
    }

    if (isSelectedTab && isFocused && appState === 'active') {
      openHomeFeedSession({ trackEvent });
    }
  }, [appState, isFocused, isHome, isSelectedTab, trackEvent]);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    if (appState !== 'active') {
      scheduleBackgroundHomeFeedSessionClose({ trackEvent });
      return;
    }

    if (!isSelectedTab) {
      scheduleHomeFeedSessionClose({ trackEvent });
    }
  }, [appState, isHome, isSelectedTab, trackEvent]);

  useEffect(() => {
    if (!isFollowing) {
      return;
    }

    if (isSelectedTab && isFocused && appState === 'active') {
      openFollowingFeedSession({ trackEvent });
    }
  }, [appState, isFocused, isFollowing, isSelectedTab, trackEvent]);

  useEffect(() => {
    if (!isFollowing) {
      return;
    }

    if (appState !== 'active') {
      scheduleBackgroundFollowingFeedSessionClose({ trackEvent });
      return;
    }

    if (!isSelectedTab) {
      scheduleFollowingFeedSessionClose({ trackEvent });
    }
  }, [appState, isFollowing, isSelectedTab, trackEvent]);

  const {
    feedItems,
    isPending,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    error,
  } = useMixedFeedItems({
    feedKey,
    feedType,
    updateState: true,
    onNullFeedItemsResponse: onNullFeedItemsResponse,
    sortMode: props.filterPinnedItems ? REVERSE_CHRON_SORT_MODE : undefined,
  });

  const [displayLimit, setDisplayLimit] = useState(LIST_BATCH_SIZE);

  // Use useDeferredValue to defer non-critical updates (iOS). On Android, the
  // deferred lane can stay stale until the next scroll because the native
  // bridge often does not flush low-priority concurrent work — pull-to-refresh
  // then fetches new data but the list still paints the old deferred slice,
  // especially when the first cast id is unchanged so a simple id comparison
  // would not detect the mismatch.
  const deferredFeedItems = React.useDeferredValue(feedItems);
  const listFeedItems =
    Platform.OS === 'android' ? feedItems : deferredFeedItems;

  // Calculate length from deferred data to avoid mismatch
  const feedItemsLength = Math.min(listFeedItems.length, displayLimit);

  const displayedFeedItems = React.useMemo(() => {
    return listFeedItems.slice(0, feedItemsLength);
  }, [listFeedItems, feedItemsLength]);

  // Guard that ensures FlashList always receives its first items after at least
  // one committed render cycle. On Android, useDeferredValue returns the current
  // value synchronously on initial mount (React 18 spec), so when React Query
  // serves cached data the loading indicator would be skipped and FlashList
  // would transition from unmounted → mounted-with-N-items in a single frame,
  // causing items to overlap before layout measurements complete.
  const [flashListReady, setFlashListReady] = useState(false);
  useEffect(() => {
    if (displayedFeedItems.length > 0 && !flashListReady) {
      setFlashListReady(true);
    }
  }, [displayedFeedItems.length, flashListReady]);

  // error isn't cleared when the retry button is pressed so created a separate
  // state-based error so we can clear it on button press so the failure indicator
  // doesn't render.
  const [fetchError, setFetchError] = useState<Error | null>(error);
  useEffect(() => {
    setFetchError(error);
  }, [error]);

  const handleEndReachedTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pendingFetchRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (handleEndReachedTimeoutRef.current) {
        clearTimeout(handleEndReachedTimeoutRef.current);
      }
    };
  }, []);

  const handleEndReached = React.useCallback(() => {
    if (handleEndReachedTimeoutRef.current) {
      clearTimeout(handleEndReachedTimeoutRef.current);
    }

    // Debounce with a small delay to batch multiple rapid calls.
    handleEndReachedTimeoutRef.current = setTimeout(() => {
      handleEndReachedTimeoutRef.current = null;
      setFetchError(null);

      // Use feedItems.length (non-deferred) so iOS useDeferredValue lag never
      // causes a redundant fetchNextPage when items are already in the cache.
      // listFeedItems (= deferredFeedItems on iOS) can be 1 page behind the
      // React Query cache, making displayLimit appear >= listFeedItems.length
      // and incorrectly triggering fetchNextPage instead of setDisplayLimit.
      const cachedLength = feedItems.length;
      if (displayLimit < cachedLength) {
        startTransition(() => {
          setDisplayLimit(cachedLength);
        });
        return;
      }

      if (!hasNextPage || isFetchingNextPage || pendingFetchRef.current) {
        return;
      }

      // isFetchingNextPage is React state and may not be committed before
      // FlashList fires onEndReached again. Mark the request synchronously so
      // repeated callbacks cannot cancel and restart the active query.
      pendingFetchRef.current = true;
      const request = fetchNextPage();
      void request.then(
        () => {
          pendingFetchRef.current = false;
        },
        () => {
          pendingFetchRef.current = false;
        },
      );
    }, SCROLL_DEBOUNCE_MS);
  }, [
    feedItems.length,
    fetchNextPage,
    displayLimit,
    hasNextPage,
    isFetchingNextPage,
  ]);

  const setMinimalShellMode = useSetMinimalShellMode();
  const headerOffset = useHeaderOffset();
  const List = onScroll ? AnimatedFlashList : FlashList;
  const listRef = useRef<FlashListRef<MixedFeedItem>>(null);
  useScrollToTopWithOffset(listRef, -(headerOffset ?? 0));

  const scrollToTop = React.useCallback(() => {
    // Defer scroll to avoid ListMetricsAggregator error
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: true,
        offset: -headerOffset,
      });
    });
    setMinimalShellMode(false);
  }, [headerOffset, setMinimalShellMode]);

  React.useEffect(() => {
    return listenResetFeedShellState(scrollToTop);
  }, [scrollToTop]);

  // Use tab-level focus for cast view recording: only the selected PagerView
  // tab should record views immediately. This prevents a cascade of
  // trackInternalEvent calls during horizontal tab swiping, where all tabs
  // have navigation-level isFocused=true simultaneously.
  const isTabFocused = isFocused && isSelectedTab;
  const viewabilityPairForFeedItemViews = useRecordCastFeedItemOnView({
    isFocused: isTabFocused,
  });

  const viewabilityPairsForPrefetchCastOnView = usePrefetchFeedItemCastOnView();
  const viewabilityPairsForPrefetchCollectibleImagesOnView =
    usePrefetchCollectibleImagesOnView();

  // Suppress viewability callbacks when a MiniApp is in the foreground or the
  // tab is not selected. This dramatically reduces JS thread contention:
  // - MiniApp active: the Feed is hidden behind the BottomSheet, so
  //   viewability tracking is wasted work that competes with the WebView.
  const { isMiniAppActive, isMiniAppFullyExpanded } = useMinimizedMiniApp({
    optional: true,
  });
  const shouldSuppressViewability = !isSelectedTab || isMiniAppActive;

  const viewabilityPairs = React.useMemo(() => {
    if (shouldSuppressViewability) {
      return EMPTY_VIEWABILITY_PAIRS;
    }

    const activePairs = [
      ...viewabilityPairsForVideos,
      ...viewabilityPairForFeedItemViews,
      ...viewabilityPairsForPrefetchCastOnView,
      ...viewabilityPairsForPrefetchCollectibleImagesOnView,
    ];

    if (!isPagerSwipingRef) {
      return activePairs;
    }

    // PagerView state changes are high-frequency native events. Read the
    // mutable state at callback time so a swipe does not re-render every
    // mounted feed just to disable and restore these callbacks.
    return activePairs.map((pair) => {
      const onViewableItemsChanged = pair.onViewableItemsChanged;
      if (!onViewableItemsChanged) {
        return pair;
      }

      return {
        ...pair,
        onViewableItemsChanged: (
          info: Parameters<typeof onViewableItemsChanged>[0],
        ) => {
          if (!isPagerSwipingRef.current) {
            onViewableItemsChanged(info);
          }
        },
      };
    });
  }, [
    isPagerSwipingRef,
    shouldSuppressViewability,
    viewabilityPairsForVideos,
    viewabilityPairForFeedItemViews,
    viewabilityPairsForPrefetchCastOnView,
    viewabilityPairsForPrefetchCollectibleImagesOnView,
  ]);

  const toast = useToast();
  const toastId = useMemo(() => `feed-${feedKey}-new-items`, [feedKey]);
  const [showNewCastsToast, setShowNewCastsToast] = useState<boolean>(false);

  const { resetFeedUnseenStatus } = useUnseen();

  const hasNewItems = useChannelFeedUnseenStatus(
    feedKey,
    feedType === 'default',
  );

  const resetUnseenStatus = useCallback(() => {
    if (feedType === 'default') {
      resetFeedUnseenStatus(feedKey);
    }
  }, [feedKey, feedType, resetFeedUnseenStatus]);

  // If the feed has unseen items, it will open like that and the usneen will stay
  // for a split second while the backend is updated. Since we don't
  // want to flash the new casts toast, we only show it after we've had no unseen items
  // at least once

  // Internal to the new casts effect below to prevent showing duplicate toasts
  const [newCastsToastIsVisible, setNewCastsToastIsVisible] =
    useState<boolean>(false);

  useEffect(() => {
    if (!toast || !toast.hide || !toast.show || feedKey !== 'home') {
      return;
    }

    if (showNewCastsToast && !newCastsToastIsVisible) {
      setNewCastsToastIsVisible(true);

      toast.hideAll();
      toast.show('New casts', {
        id: toastId,
        duration: 5 * 60 * 1000, // 5 min as we show when user comes back
        type: 'refreshFeed',
        onClose: () => {
          setShowNewCastsToast(false);
        },
        onPress: async () => {
          toast.hide(toastId);
          // resetUnseenStatus();
          setShowNewCastsToast(false);

          trackEvent(AnalyticsEvent.ClickNewCastsToast, {});

          await fetchPreviousPage();

          // Defer scroll to avoid ListMetricsAggregator error
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
              animated: true,
              offset: -headerOffset,
            });
          });
        },
      });
    } else if (!showNewCastsToast) {
      setNewCastsToastIsVisible(false);
      toast.hide(toastId);
    }
  }, [
    feedKey,
    fetchPreviousPage,
    headerOffset,
    newCastsToastIsVisible,
    // resetUnseenStatus,
    showNewCastsToast,
    toast,
    toastId,
    trackEvent,
  ]);

  const refreshNewCastsToast = useCallback(() => {
    if (hasNewItems) {
      setShowNewCastsToast(true);
    } else if (!hasNewItems) {
      setShowNewCastsToast(false);
    }
  }, [hasNewItems]);

  useEffect(() => {
    // Shows the refresh toast after:
    // - opening the feed screen
    // - useUnseen() reports that the feed has new items
    // - user activates this tab (clicking/swiping from another one)
    refreshNewCastsToast();
  }, [refreshNewCastsToast]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          // Show the refresh toast after switching to the app
          refreshNewCastsToast();
        }
      },
    );
    return () => {
      appStateSubscription.remove();
    };
  }, [refreshNewCastsToast]);

  // Mirror the live feed list so pullToRefresh can synthesize cast-view events
  // for the visible top-N without taking listFeedItems as a dependency (which
  // would re-create the callback — and the RefreshControl element — on every
  // data update).
  const listFeedItemsRef = useRef(listFeedItems);
  useEffect(() => {
    listFeedItemsRef.current = listFeedItems;
  }, [listFeedItems]);

  const pullToRefresh = useCallback(async () => {
    if (onPullToRefresh) {
      onPullToRefresh();
    }
    toast.hide(toastId);
    resetUnseenStatus();
    setShowNewCastsToast(false);

    if (isHome) {
      refreshFeatureFlagsAfterHomeFeedPullToRefresh();
    }

    // Reset displayLimit so the fresh first page renders correctly, especially
    // when the user had scrolled far down before pulling.
    setDisplayLimit(LIST_BATCH_SIZE);

    // Synthesize cast-view events for the visible top-N feed items before the
    // request fires. The home ranker uses these signals to re-rank; without
    // organic scroll the buffer is empty between PTRs (drained by the previous
    // fetch), so consecutive pulls would send identical params and get back
    // identical rankings. InternalEventingProvider dedups by cast hash, so
    // this is a no-op when viewability has already recorded the same items.
    if (isHome) {
      const items = listFeedItemsRef.current;
      let synthesizedIndex = 0;
      for (
        let i = 0;
        i < items.length && synthesizedIndex < HOME_PTR_SYNTHESIZE_TOP_N;
        i++
      ) {
        const item = items[i];
        if (!item) {
          continue;
        }
        if (item.type !== FeedItemType.Cast) {
          continue;
        }
        trackCastView({
          castHash: item.item.cast.hash,
          castAuthorFid: item.item.cast.author.fid,
          includeReason: item.item.meta?.includeReason?.type,
          index: i,
        });
        synthesizedIndex++;
      }
    }

    const result = await fetchPreviousPage();

    if (result.replaceFeed) {
      scrollToTop();
      resetUnseenStatus();
    }
  }, [
    fetchPreviousPage,
    isHome,
    onPullToRefresh,
    resetUnseenStatus,
    scrollToTop,
    toast,
    toastId,
    trackCastView,
  ]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: pullToRefresh,
    offset: headerHeight,
  });

  const renderItem = useCallback(
    ({ item, index }: { item: MixedFeedItem | undefined; index: number }) => {
      if (!item) {
        return null;
      }

      const itemContent = (() => {
        switch (item.type) {
          case FeedItemType.Cast:
            return (
              <CastFeedItem
                feedItem={item.item}
                castOpenIncludeReason={
                  isHome ? item.item.meta?.includeReason?.type : undefined
                }
                index={index}
                // Either show recast labels (on normal channel feeds) or replying to labels (on trending)
                mainCastOmitReplyingTo={isHome ? false : showCastSourceLabels}
                showSourceLabels={isHome ? true : showCastSourceLabels}
                showAdminGatedFeedCastTreatment={isHome}
                showChannelTag={
                  isHome ? !item.item.cast.parentHash : showChannelTag
                }
              />
            );
          case FeedItemType.UserRecommendations:
            return <UserRecommendations recommendations={item.item} />;
          case FeedItemType.TrendingTopics:
            return <TrendingTopicsList trendingTopics={item.item} />;
          default:
            return null;
        }
      })();

      if (!itemContent) {
        return null;
      }

      // Isolate per-cell render failures (e.g. a recycled/released expo-video
      // player throwing) so one bad cell can't blank the entire feed. resetKey
      // reuses the FlashList key (content-stable across React Query cache
      // updates) so a recycled cell resets only when it shows a different item,
      // not on every cache write.
      return (
        <FeedItemErrorBoundary resetKey={extractMixedFeedItemKey(item, index)}>
          {itemContent}
        </FeedItemErrorBoundary>
      );
    },
    [isHome, showCastSourceLabels, showChannelTag],
  );

  const getItemType = getMixedFeedItemType;

  const contentContainerStyle = React.useMemo(
    () => ({
      paddingBottom: headerHeight,
    }),
    [headerHeight],
  );

  // Keep loading indicator visible until listFeedItems has caught up AND
  // FlashList has had at least one committed render cycle before receiving items.
  // Without the deferred-value check, when feedItems arrives but deferredFeedItems
  // is still empty, FlashList renders with data=[] then immediately jumps to
  // data=[N items], causing items to overlap before layout is established.
  // Without the flashListReady gate, cached data served synchronously on mount
  // bypasses the deferred-value window (useDeferredValue returns the current
  // value on initial render per React 18 spec), reproducing the same overlap
  // on Android where layout correction is slower.
  const shouldShowLoadingIndicator = React.useMemo(
    () =>
      (isPending && !listFeedItems.length) ||
      (feedItems.length > 0 && listFeedItems.length === 0) ||
      (listFeedItems.length > 0 && displayedFeedItems.length === 0) ||
      (displayedFeedItems.length > 0 && !flashListReady),
    [
      isPending,
      feedItems.length,
      listFeedItems.length,
      displayedFeedItems.length,
      flashListReady,
    ],
  );

  const shouldShowEmptyState = React.useMemo(
    () => !isPending && !isError && !feedItems.length && !listFeedItems.length,
    [isPending, isError, feedItems.length, listFeedItems.length],
  );

  const footer = useMemo(
    () =>
      fetchError ? (
        <LoadFailureIndicator retry={handleEndReached} />
      ) : hasNextPage && isFetchingNextPage ? (
        <FeedLoadingIndicator headerHeight={headerHeight} />
      ) : null,
    [
      fetchError,
      handleEndReached,
      hasNextPage,
      isFetchingNextPage,
      headerHeight,
    ],
  );

  const header = useMemo(
    () => <View style={{ paddingTop: headerHeight }}>{banner}</View>,
    [headerHeight, banner],
  );

  if (fetchError && !listFeedItems.length) {
    return (
      <LoadFailureIndicator
        style={[{ marginTop: (headerHeight || 0) + 14 }]}
        retry={() => {
          setFetchError(null);
          fetchPreviousPage();
        }}
      />
    );
  }

  if (shouldShowLoadingIndicator) {
    return <FeedLoadingIndicator headerHeight={headerHeight} />;
  }

  if (shouldShowEmptyState) {
    if (isHome) {
      return (
        <View style={[t.hFull, t.justifyCenter, t.itemsCenter, t.p4]}>
          <Text style={[t.texts.secondary, t.textBase]}>
            Nothing to see here, yet.
          </Text>
          <AtomsButton
            size="s"
            hierarchy="primary"
            style={[t.mY4, t.p0]}
            onPress={() => {
              navigate('ExploreScreen', {});
            }}
          >
            Explore
          </AtomsButton>
          <AtomsButton
            size="s"
            hierarchy="secondary"
            style={[t.mT4, t.w38]}
            onPress={() => {
              fetchPreviousPage();
            }}
          >
            Refresh
          </AtomsButton>
        </View>
      );
    } else {
      return (
        <View style={[t.hFull, t.flexCol, t.itemsCenter, t.justifyCenter]}>
          <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
            {'No casts, yet'}
          </Text>
        </View>
      );
    }
  }
  return (
    // Once a mini app is fully expanded its BottomSheet occludes the feed, but
    // RN has no view-level occlusion culling so the RenderThread keeps
    // compositing the feed underneath every frame the mini app redraws. Hiding
    // it with `display: 'none'` keeps the list mounted (scroll state preserved)
    // while skipping its draw. Gated on `isMiniAppFullyExpanded` (not
    // `isMiniAppActive`) so the feed stays visible during the slide-up and only
    // drops once it is actually covered.
    <View style={[t.flex1, isMiniAppFullyExpanded && { display: 'none' }]}>
      <AnimatedImageViewabilityScopeProvider>
        <List
          data={displayedFeedItems}
          extraData={extraData}
          renderItem={renderItem}
          getItemType={getItemType}
          ref={listRef}
          keyExtractor={extractMixedFeedItemKey}
          refreshControl={refreshControl}
          onEndReached={handleEndReached}
          onEndReachedThreshold={feedOnEndReachedThreshold}
          contentContainerStyle={contentContainerStyle}
          onScroll={onScroll}
          ListHeaderComponent={header}
          viewabilityConfigCallbackPairs={viewabilityPairs}
          ListFooterComponent={footer}
          {...STANDARD_FLASHLIST_PERF_PROPS}
        />
      </AnimatedImageViewabilityScopeProvider>
    </View>
  );
});

FeedContent.displayName = 'FeedContent';

export { Feed };
