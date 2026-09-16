import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { isFarcasterApiError } from 'farcaster-client-data';
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

// Worst-case pagination cycle is ~27s (4 React Query attempts × 5s timeout +
// backoff). A fetchNextPage promise unsettled past this is wedged — most
// likely paused by networkMode 'offlineFirst' while NetInfo reports offline,
// where the promise never settles on its own (NEYN-13137). The watchdog clears
// the in-flight guard and flags the stall so the footer offers Retry, which
// cancels the wedged fetch and starts a clean one; it also reports the
// occurrence to analytics. It deliberately does not cancel the query itself —
// see the paginationStalled declaration.
const PENDING_FETCH_WATCHDOG_MS = 45 * 1000;

// Error-derived diagnostics for the feed-pagination analytics events. Mobile
// RUM is dark, so these events are the production record of WHY pagination
// failed: timeout vs offline vs HTTP status, and the timeout budget the
// request actually ran with (surfaces timeout-decay starvation).
function describePaginationError(
  error: Error,
): Record<string, string | boolean | number | undefined> {
  return {
    errorName: error.name,
    errorMessage: error.message.slice(0, 200),
    ...(isFarcasterApiError(error)
      ? {
          endpointName: error.endpointName,
          httpStatus: error.status,
          hasTimedOut: error.hasTimedOut,
          isNetworkError: error.isNetworkError,
          clientMarkedOffline: error.isOffline,
          resolvedTimeoutMs: error.resolvedTimeout,
        }
      : {}),
  };
}

// Device connectivity at the moment of a pagination event. NetInfo state is
// the discriminator between "server misbehaving" and "user in a dead zone".
async function connectivitySnapshot(): Promise<
  Record<string, string | boolean | number | undefined>
> {
  try {
    const netInfo = await NetInfo.fetch();
    return {
      netConnected: netInfo.isConnected ?? undefined,
      netReachable: netInfo.isInternetReachable ?? undefined,
      netType: netInfo.type,
    };
  } catch {
    return {};
  }
}

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

// Footer for the offlineFirst 'paused' state: the query wants the next page
// but NetInfo reports no connection, so React Query is holding the fetch and
// will resume it automatically on reconnect. Previously this state rendered
// nothing — the feed just dead-ended (NEYN-13137).
function FeedWaitingForConnectionIndicator() {
  const t = useTheme();

  return (
    <View style={[t.wFull, t.itemsCenter, t.pY4]}>
      <Text style={[t.texts.tertiary, t.textSm]}>Waiting for connection…</Text>
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
    retryFetchNextPage,
    hasNextPage,
    error,
    fetchStatus,
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

  // The pagination failure that currently owns `error`, or null. Set only from
  // startPaginationFetch's own settle path, which is the one place a
  // pagination outcome is observed directly.
  //
  // Attribution cannot be inferred from `hasNextPage` (fetchPreviousPage
  // truncates the cache to page 1, so a failed refresh can leave a retained
  // page still reporting hasNextPage === true) nor from the last handler this
  // component ran: React Query refetches active feeds on its own via
  // useInvalidateFeedItems (useDeleteCast, usePinCast, useBanUserFromChannel,
  // …), and those never pass through here at all. So identify the one case we
  // can be sure of and treat everything else as a refresh (NEYN-13137).
  const [paginationError, setPaginationError] = useState<Error | null>(null);

  // Set when the watchdog abandons a pagination fetch that never settled.
  // Clearing the local epoch alone does not unbrick the query: the underlying
  // React Query fetch is still active, so isFetchingNextPage keeps the scroll
  // guard closed, and while it is paused the footer shows "waiting for
  // connection" rather than Retry — the watchdog could report the stall but
  // not recover from it. This flag surfaces Retry, whose retryFetchNextPage
  // cancels the wedged fetch before starting a fresh one. We deliberately do
  // not cancel from the watchdog itself: a genuinely offline user still has
  // React Query's automatic resume-on-reconnect, which cancelling would throw
  // away (NEYN-13137).
  const [paginationStalled, setPaginationStalled] = useState(false);

  useEffect(() => {
    setFetchError(error);
    // A pagination failure owns the displayed error only while it *is* the
    // displayed error. Any other outcome — a success, or a different failure
    // from a refresh or a query-driven refetch — drops the attribution.
    setPaginationError((current) =>
      current && current === error ? current : null,
    );
  }, [error]);

  // Failure/recovery bookkeeping for analytics: first failure timestamp and
  // count of consecutive failed pagination cycles, cleared on the next
  // successful one.
  const failureStateRef = useRef<{
    firstFailureAt: number;
    failureCount: number;
  } | null>(null);

  // Reports the outcome of one pagination cycle. Deliberately driven by the
  // per-fetch result rather than the query-level `error`: that error is shared
  // by first-page loads and pull-to-refresh, so keying off it would report
  // cold-start and refresh failures as pagination failures and make the metric
  // unusable for judging this fix (NEYN-13137).
  const reportPaginationOutcome = React.useCallback(
    (paginationError: Error | null) => {
      setPaginationError(paginationError);
      setPaginationStalled(false);
      if (paginationError) {
        if (!failureStateRef.current) {
          failureStateRef.current = {
            firstFailureAt: Date.now(),
            failureCount: 0,
          };
        }
        failureStateRef.current.failureCount += 1;
        const failureCount = failureStateRef.current.failureCount;
        void connectivitySnapshot().then((net) => {
          trackEvent(AnalyticsEvent.FeedPaginationFailure, {
            feedKey,
            failureCount,
            ...describePaginationError(paginationError),
            ...net,
          });
        });
        return;
      }

      if (failureStateRef.current) {
        const { firstFailureAt, failureCount } = failureStateRef.current;
        failureStateRef.current = null;
        trackEvent(AnalyticsEvent.FeedPaginationRecovered, {
          feedKey,
          failuresBeforeSuccess: failureCount,
          downtimeMs: Date.now() - firstFailureAt,
        });
      }
    },
    [feedKey, trackEvent],
  );

  const handleEndReachedTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // In-flight pagination guard. isFetchingNextPage is React state and may not
  // be committed before FlashList fires onEndReached again, so the guard is
  // marked synchronously. It is an id (not a boolean) so a stale request's
  // settle callback can never clear the guard of a newer one, and a watchdog
  // clears it if the promise never settles — with networkMode 'offlineFirst',
  // a fetch whose retry pauses while offline stays pending indefinitely and a
  // boolean guard turned Retry and further scrolls into permanent no-ops
  // (NEYN-13137).
  const fetchSeqRef = React.useRef(0);
  const pendingFetchIdRef = React.useRef(0); // 0 = nothing in flight
  const pendingWatchdogRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const fetchStatusRef = React.useRef(fetchStatus);
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  React.useEffect(() => {
    return () => {
      if (handleEndReachedTimeoutRef.current) {
        clearTimeout(handleEndReachedTimeoutRef.current);
      }
      if (pendingWatchdogRef.current) {
        clearTimeout(pendingWatchdogRef.current);
      }
    };
  }, []);

  const startPaginationFetch = React.useCallback(
    (run: () => Promise<{ error?: Error | null } | void>): Promise<void> => {
      const id = ++fetchSeqRef.current;
      pendingFetchIdRef.current = id;
      setPaginationStalled(false);

      if (pendingWatchdogRef.current) {
        clearTimeout(pendingWatchdogRef.current);
      }
      pendingWatchdogRef.current = setTimeout(() => {
        if (pendingFetchIdRef.current !== id) {
          return;
        }
        pendingFetchIdRef.current = 0;
        setPaginationStalled(true);
        void connectivitySnapshot().then((net) => {
          trackEvent(AnalyticsEvent.FeedPaginationStuck, {
            feedKey,
            fetchStatus: fetchStatusRef.current,
            pendingForMs: PENDING_FETCH_WATCHDOG_MS,
            ...net,
          });
        });
      }, PENDING_FETCH_WATCHDOG_MS);

      // Returns whether this fetch is still the current one. A superseded or
      // watchdog-abandoned fetch must neither clear a newer fetch's guard nor
      // report an outcome the newer fetch will report itself.
      const settle = (): boolean => {
        if (pendingFetchIdRef.current !== id) {
          return false;
        }
        pendingFetchIdRef.current = 0;
        if (pendingWatchdogRef.current) {
          clearTimeout(pendingWatchdogRef.current);
          pendingWatchdogRef.current = null;
        }
        return true;
      };

      return run().then(
        (result) => {
          if (settle()) {
            // fetchNextPage resolves (not rejects) with an error result once
            // React Query's retries are exhausted.
            reportPaginationOutcome(result?.error ?? null);
          }
        },
        (thrown: unknown) => {
          if (settle()) {
            reportPaginationOutcome(
              thrown instanceof Error ? thrown : new Error(String(thrown)),
            );
          }
        },
      );
    },
    [feedKey, reportPaginationOutcome, trackEvent],
  );

  const handleEndReached = React.useCallback(() => {
    if (handleEndReachedTimeoutRef.current) {
      clearTimeout(handleEndReachedTimeoutRef.current);
    }

    // Debounce with a small delay to batch multiple rapid calls.
    handleEndReachedTimeoutRef.current = setTimeout(() => {
      handleEndReachedTimeoutRef.current = null;

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

      // After a failed pagination, wait for the explicit Retry button instead
      // of silently refetching on every scroll near the bottom. The old
      // auto-restart cleared the failure indicator and, on a bad connection,
      // produced an endless spinner loop with Retry taps swallowed mid-cycle
      // (NEYN-13137).
      if (fetchError) {
        return;
      }

      if (
        !hasNextPage ||
        isFetchingNextPage ||
        pendingFetchIdRef.current !== 0
      ) {
        return;
      }

      void startPaginationFetch(() => fetchNextPage());
    }, SCROLL_DEBOUNCE_MS);
  }, [
    feedItems.length,
    fetchError,
    fetchNextPage,
    displayLimit,
    hasNextPage,
    isFetchingNextPage,
    startPaginationFetch,
  ]);

  // Explicit retry from the footer failure indicator. Cancels any in-flight
  // or offline-paused fetch first (via retryFetchNextPage) so the retry
  // always starts a fresh request; the epoch guard means the cancelled
  // request's settle callback can't clear the new request's guard.
  //
  // `fetchError` is deliberately NOT cleared up front: clearing it unmounts
  // this very indicator, hiding its in-progress spinner and blanking the
  // footer mid-retry. The error mirror effect clears it when the retry
  // actually resolves.
  const handleRetryPress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.FeedPaginationRetry, {
      feedKey,
      hadPendingFetch: pendingFetchIdRef.current !== 0,
      fetchStatus: fetchStatusRef.current,
      hasNextPage,
      errorSource: paginationError
        ? 'pagination'
        : paginationStalled
          ? 'pagination-stalled'
          : 'refresh',
    });

    // Paginate only on positive evidence that pagination is what failed.
    // Everything else that can populate `error` — the first-page load, a
    // pull-to-refresh, and query-driven refetches that never reach this
    // component — is a refresh, which is also the safe default: refreshing a
    // feed whose pagination failed still repairs the view, whereas paginating
    // after a failed refresh fetches older items and clears the error without
    // retrying anything.
    //
    // hasNextPage stays as a second condition because with no next page
    // retryFetchNextPage resolves straight from cache without issuing a
    // request, and React Query counts that as a success (NEYN-13137).
    if ((paginationError || paginationStalled) && hasNextPage) {
      await startPaginationFetch(() => retryFetchNextPage());
      return;
    }

    await fetchPreviousPage();
  }, [
    feedKey,
    fetchPreviousPage,
    hasNextPage,
    paginationError,
    paginationStalled,
    retryFetchNextPage,
    startPaginationFetch,
    trackEvent,
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

  // 'paused' normally wins over the error state: React Query resumes the fetch
  // itself on reconnect, so offering Retry there would just spin against a
  // dead network. A watchdog-flagged stall is the exception — the fetch has
  // been unsettled long past any legitimate retry cycle, so the automatic
  // resume is not coming and Retry is the only way out. The failure
  // indicator's Retry cancels the wedged fetch and starts a fresh one
  // (handleRetryPress), instead of routing through the guarded scroll handler
  // where it silently no-oped.
  const isPaused = fetchStatus === 'paused';
  const footer = useMemo(
    () =>
      isPaused && hasNextPage && !paginationStalled ? (
        <FeedWaitingForConnectionIndicator />
      ) : fetchError || paginationStalled ? (
        <LoadFailureIndicator retry={handleRetryPress} />
      ) : hasNextPage && isFetchingNextPage ? (
        <FeedLoadingIndicator headerHeight={headerHeight} />
      ) : null,
    [
      isPaused,
      fetchError,
      paginationStalled,
      handleRetryPress,
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
        // Return the promise so LoadFailureIndicator's spinner spans the
        // retry, and let the error-mirroring effect clear `fetchError` once it
        // resolves — the same reasoning as handleRetryPress. Clearing up front
        // unmounted this indicator immediately, and with cached empty data an
        // offline-paused refetch can retain the same error object, so nothing
        // would have brought the indicator back.
        retry={() => fetchPreviousPage()}
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
