import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
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
import { useDefaultToastProviderProps } from 'farcaster-expo';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, AppStateStatus, Image, Pressable, View } from 'react-native';
import Animated, {
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { ToastProvider, useToast } from 'react-native-toast-notifications';

import { CastFeedItem } from '~/components/CastFeedItem';
import { LoadFailureIndicator } from '~/components/LoadFailureIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { UserRecommendations } from '~/components/recommendations/UserRecommendations';
import { Text, Text2 } from '~/components/Text';
import { CastActionErrorToast } from '~/components/toasts/CastActionErrorToast';
import { CastActionToast } from '~/components/toasts/CastActionToast';
import { CastBookmarkedToast } from '~/components/toasts/CastBookmarkedToast';
import { CastBookmarkRemovedToast } from '~/components/toasts/CastBookmarkRemovedToast';
import { GenericToast } from '~/components/toasts/GenericToast';
import { ShareSheetCopyToClipboardToast } from '~/components/toasts/ShareSheetCopyToClipboardToast';
import { ShareSheetDirectCastsToast } from '~/components/toasts/ShareSheetDirectCastsToast';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useAppState } from '~/hooks/useAppState';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { usePrefetchFeedItemCastOnView } from '~/hooks/usePrefetchFeedItemCastOnView';
import { useRecordCastFeedItemOnView } from '~/hooks/useRecordCastFeedItemOnView';
import { ResultReturnedNullError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  extractMixedFeedItemKey,
  getMixedFeedItemType,
} from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  openHomeFeedSession,
  scheduleBackgroundHomeFeedSessionClose,
} from '~/utils/HomeFeedSessionTracking';

const EmptyChannelDark = require('~/assets/images/EmptyChannelDark.webp');
const EmptyChannelLight = require('~/assets/images/EmptyChannelLight.webp');

interface ChannelFeedProps {
  feedKey: string;
  feedType: string;
  Header: React.ReactElement;
  scrollOffset: SharedValue<number>;
  fixedHeaderHeight: SharedValue<number>;
  stickyHeaderHeight: SharedValue<number>;
  offsetToContent: boolean;
  showCastSourceLabels?: boolean; // ignored for home feed
}

const ChannelFeed: FC<ChannelFeedProps> = memo(({ ...props }) => {
  const t = useTheme();
  const defaultToastProps = useDefaultToastProviderProps();

  return (
    <View style={[t.relative, t.hFull]}>
      <ToastProvider
        {...defaultToastProps}
        placement="top"
        // Swipe doesn't work because the tabs also swipe
        swipeEnabled={false}
        offsetTop={120}
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
            <Animated.View style={[t.relative]}>
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
        <EventingProvider channel={props.feedKey} feed={props.feedType}>
          <ChannelFeedInner {...props} />
        </EventingProvider>
      </ToastProvider>
    </View>
  );
});

ChannelFeed.displayName = 'ChannelFeed';

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as unknown as React.ComponentClass<FlashListProps<MixedFeedItem>>,
);

const ChannelFeedInner: FC<ChannelFeedProps> = memo((props) => {
  const {
    feedKey,
    feedType = 'default',
    Header,
    scrollOffset,
    fixedHeaderHeight,
    stickyHeaderHeight,
    offsetToContent,
  } = props;

  const isHome = feedKey === 'home';
  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const appState = useAppState();
  const isFocused = useIsFocused();
  const extraData = useCommonFlatListExtraData();
  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();

  const onNullFeedItemsResponse = useCallback(() => {
    trackError(
      new ResultReturnedNullError({
        screenOrProviderId: 'ChannelFeedInner',
      }),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isHome) {
        trackEvent(AnalyticsEvent.ViewChannel, {
          channel: feedKey,
          'feed type': feedType,
        });
      }
    }, [isHome, trackEvent, feedKey, feedType]),
  );

  useEffect(() => {
    if (!isHome) {
      return;
    }

    if (isFocused && appState === 'active') {
      openHomeFeedSession({ trackEvent });
    }
  }, [appState, isFocused, isHome, trackEvent]);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    if (appState !== 'active') {
      scheduleBackgroundHomeFeedSessionClose({ trackEvent });
    }
  }, [appState, isHome, trackEvent]);

  const {
    feedItems,
    isPending,
    isFetchingNextPage,
    fetchNextPage,
    fetchPreviousPage,
    error,
    hasNextPage,
  } = useMixedFeedItems({
    feedKey,
    feedType,
    updateState: true,
    onNullFeedItemsResponse: onNullFeedItemsResponse,
  });

  // error isn't cleared when the retry button is pressed so created a separate
  // state-based error so we can clear it on button press so the failure indicator
  // doesn't render.
  const [fetchError, setFetchError] = useState<Error | null>(error);
  useEffect(() => {
    setFetchError(error);
  }, [error]);

  const INITIAL_BATCH_SIZE = 5;

  const {
    displayedItems: displayedFeedItems,
    handleEndReached: handleEndReachedFromHelper,
  } = useDisplayLimit({
    data: feedItems,
    batchSize: INITIAL_BATCH_SIZE,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  });

  const handleEndReached = React.useCallback(() => {
    setFetchError(null);
    handleEndReachedFromHelper();
  }, [handleEndReachedFromHelper]);

  const flashlistRef = useAnimatedRef<FlashListRef<MixedFeedItem>>();
  const viewabilityPairForFeedItemViews = useRecordCastFeedItemOnView({
    isFocused,
  });
  const viewabilityPairsForPrefetchCastOnView = usePrefetchFeedItemCastOnView();

  const viewabilityConfigCallbackPairsRef = React.useRef([
    ...viewabilityPairsForVideos,
    ...viewabilityPairForFeedItemViews,
    ...viewabilityPairsForPrefetchCastOnView,
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
    if (!toast || !toast.hide || !toast.show) {
      return;
    }

    if (showNewCastsToast && !newCastsToastIsVisible) {
      setNewCastsToastIsVisible(true);

      toast.hide(toastId);
      toast.show('New casts', {
        id: toastId,
        duration: 5 * 60 * 1000, // 5 min as we show when user comes back
        type: 'refreshFeed',
        onClose: () => {
          setShowNewCastsToast(false);
        },
        onPress: async () => {
          toast.hide(toastId);
          resetUnseenStatus();
          setShowNewCastsToast(false);

          trackEvent(AnalyticsEvent.ClickNewCastsToast, {});

          await fetchPreviousPage();

          flashlistRef.current?.scrollToOffset({
            animated: true,
            offset: 0,
          });
        },
      });
    } else if (!showNewCastsToast) {
      setNewCastsToastIsVisible(false);
      toast.hide(toastId);
    }
  }, [
    newCastsToastIsVisible,
    showNewCastsToast,
    trackEvent,
    toast,
    toastId,
    resetUnseenStatus,
    fetchPreviousPage,
    flashlistRef,
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

  const pullToRefresh = useCallback(async () => {
    toast.hide(toastId);
    resetUnseenStatus();
    setShowNewCastsToast(false);
    await fetchPreviousPage();
  }, [fetchPreviousPage, resetUnseenStatus, toast, toastId]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: pullToRefresh,
    offset: 0,
  });

  const didApplyInitialScroll = useSharedValue<boolean>(!offsetToContent);
  useEffect(() => {
    didApplyInitialScroll.value = !offsetToContent;
  }, [didApplyInitialScroll, offsetToContent]);

  const initialScrollOffset = useDerivedValue(() => {
    if (fixedHeaderHeight.value === 0 || stickyHeaderHeight.value === 0) {
      return 0;
    }

    return fixedHeaderHeight.value - stickyHeaderHeight.value;
  });

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  useDerivedValue(() => {
    if (!didApplyInitialScroll.value && initialScrollOffset.value) {
      scrollTo(flashlistRef, 0, initialScrollOffset.value, false);
      didApplyInitialScroll.value = true;
    }
  });

  const ListEmptyComponent = useMemo(() => {
    if (fetchError) {
      return null;
    }
    if (!isPending) {
      return (
        <View style={[t.hFull, t.flexCol, t.itemsCenter, t.mY4]}>
          <Image
            source={t.dark ? EmptyChannelDark : EmptyChannelLight}
            style={[t.mB2]}
            resizeMode={'cover'}
          />
          <Text2 align="center" color="secondary" size="sm">
            This channel has no casts yet
          </Text2>
        </View>
      );
    }
    return <LoadingIndicator style={[{ marginTop: 14 }]} />;
  }, [
    fetchError,
    isPending,
    t.hFull,
    t.flexCol,
    t.itemsCenter,
    t.mY4,
    t.dark,
    t.mB2,
  ]);

  return (
    <Animated.View style={[t.hFull]}>
      <AnimatedImageViewabilityScopeProvider>
        <AnimatedFlashList
          ref={
            flashlistRef as unknown as React.RefObject<
              React.Component<FlashListProps<MixedFeedItem>>
            >
          }
          data={displayedFeedItems}
          extraData={extraData}
          renderItem={renderItem}
          getItemType={getItemType}
          onScroll={scrollHandler}
          keyExtractor={extractMixedFeedItemKey}
          refreshControl={refreshControl}
          onEndReached={handleEndReached}
          onEndReachedThreshold={feedOnEndReachedThreshold}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={Header}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairsRef.current
          }
          ListFooterComponent={
            fetchError ? (
              <LoadFailureIndicator retry={handleEndReached} />
            ) : hasNextPage ? (
              <View style={[t.h36, t.mT8]}>
                <LoadingIndicator />
              </View>
            ) : null
          }
        />
      </AnimatedImageViewabilityScopeProvider>
    </Animated.View>
  );
});

const renderItem = ({
  item,
  index,
}: {
  item: MixedFeedItem;
  index: number;
}) => {
  switch (item.type) {
    case FeedItemType.Cast:
      return (
        <CastFeedItem
          feedItem={item.item}
          index={index}
          showChannelTag={false}
        />
      );
    case FeedItemType.UserRecommendations:
      return <UserRecommendations recommendations={item.item} />;
    default:
      return null;
  }
};

const getItemType = getMixedFeedItemType;

ChannelFeedInner.displayName = 'ChannelFeedInner';

export { ChannelFeed };
