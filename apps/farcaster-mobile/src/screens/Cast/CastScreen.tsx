import {
  getDefaultHeaderHeight,
  useHeaderHeight,
} from '@react-navigation/elements';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { InfiniteData } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiChannelMinimal,
  ApiGetThread200Response,
  ApiGetUserThreadCasts200Response,
  ApiOnchainTokenMinimal,
  CastHashPrefix,
} from 'farcaster-client-data';
import {
  castIsParentUrlHeader,
  EventingPropOverrideProvider,
  EventingProvider,
  extractThreadListItemKey,
  FeedSourceOn,
  getConversationThreadItems,
  ThreadItem,
  ThreadListItem,
  useGetGloballyCachedCast,
  useGetGloballyCachedCastWithUsernameAndPrefix,
  useNonSuspenseThread,
  useNonSuspenseUserThreadCasts,
  useTrackEvent,
  useUserThreadWithHiddenReplies,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppBackButton } from '~/components/AppBackButton';
import { ShowMore } from '~/components/CastFeedItem/ShowMore';
import { Cast } from '~/components/casts/Cast';
import {
  ChannelTagPressable,
  TokenTagPressable,
} from '~/components/ChannelsV3/ChannelTagPressable';
import { FragmentProxy } from '~/components/FragmentProxy';
import { UnhideIcon } from '~/components/images/UnhideIcon';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { isFabricEnabledOnIOS } from '~/hooks/navigation/useFabricChromeInsetFix';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToFeed } from '~/hooks/navigation/useNavigateToFeed';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { usePrefetchThreadCast } from '~/hooks/usePrefetchThreadCast';
import { useRecordThreadItemOnView } from '~/hooks/useRecordThreadItemOnView';
import {
  useIsWithinTabNavigator,
  useSetTabBarTopBorderHidden,
} from '~/navigation/BottomTabNavigatorContext';
import { CommonStackParamList } from '~/types';

import { CastScreenQuickReply } from './CastScreenQuickReply';

type CastScreenHeaderLeftProps = {
  castChannel: ApiChannelMinimal | undefined;
  castToken: ApiOnchainTokenMinimal | undefined;
};

const CastScreenHeaderLeft: React.FC<CastScreenHeaderLeftProps> = React.memo(
  ({ castChannel, castToken }) => {
    const t = useTheme();

    const goBack = useGoBack();

    const navigateToFeed = useNavigateToFeed();
    const navigate = useNavigate();

    const onHeaderBackPress = React.useCallback(() => {
      goBack();
    }, [goBack]);

    const onChannelTagPress = React.useCallback(() => {
      if (typeof castChannel === 'undefined') {
        return;
      }

      navigateToFeed(castChannel.key);
    }, [castChannel, navigateToFeed]);

    const onTokenTagPress = React.useCallback(() => {
      if (typeof castToken === 'undefined') {
        return;
      }

      navigate('Token', {
        chain: castToken.chain,
        ca: castToken.ca,
        via: 'cast_tag',
      });
    }, [castToken, navigate]);

    return (
      <Pressable
        onPress={onHeaderBackPress}
        accessibilityRole="button"
        accessibilityLabel="Go back to conversation"
        style={[t.flex, t.flexRow, t.itemsCenter, t._mL2, t.pX2]}
      >
        <AppBackButton onPress={onHeaderBackPress} />
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.mL1]}>
          <Text style={[t.texts.primary, t.textLg, t.fontSemibold]}>
            Conversation
          </Text>
          {(castToken || castChannel) && (
            <Text style={[t.texts.primary, t.textLg, t.fontSemibold]}> in</Text>
          )}
          {castChannel && (
            <View style={[{ marginTop: 2 }]}>
              <ChannelTagPressable
                channel={castChannel}
                hitSlop={undefined}
                inversedTextColors={false}
                onPress={onChannelTagPress}
                size="threads"
              />
            </View>
          )}
          {castToken && (
            <View style={[{ marginTop: 2 }]}>
              <TokenTagPressable
                token={castToken}
                hitSlop={undefined}
                inversedTextColors={false}
                onPress={onTokenTagPress}
                size="threads"
              />
            </View>
          )}
        </View>
      </Pressable>
    );
  },
);

type CastScreenProps = NativeStackScreenProps<CommonStackParamList, 'Cast'>;

const CastScreen = buildScreen<CastScreenProps>(
  { name: 'Cast' },
  ({ route: { params } }) => {
    if ('castHash' in params) {
      return (
        <RetryableErrorBoundary>
          <CastScreenWithHash
            castHash={params.castHash}
            castOpenIncludeReason={params.castOpenIncludeReason}
            sourceOn={params.sourceOn}
            navigatedFromCastToast={params.navigatedFromCastToast}
          />
        </RetryableErrorBoundary>
      );
    } else if (params.castHashPrefix && params.username) {
      return (
        <RetryableErrorBoundary>
          <CastScreenWithUsernameAndCastHashPrefix
            castHashPrefix={params.castHashPrefix}
            castOpenIncludeReason={params.castOpenIncludeReason}
            sourceOn={params.sourceOn}
            username={params.username}
            navigatedFromCastToast={params.navigatedFromCastToast}
          />
        </RetryableErrorBoundary>
      );
    }

    throw new Error('Missing fid or username.');
  },
);

type CastScreenWithHashProps = {
  castHash: string;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  navigatedFromCastToast?: boolean;
};

const CastScreenWithHash = ({
  castHash,
  castOpenIncludeReason,
  sourceOn,
  navigatedFromCastToast,
}: CastScreenWithHashProps) => {
  const getGloballyCachedCast = useGetGloballyCachedCast();

  const cachedFocusedCast = useMemo(
    () => getGloballyCachedCast({ hash: castHash, recast: false }),
    [castHash, getGloballyCachedCast],
  );

  const {
    data,
    hasNextPage,
    onEndReached,
    refetch,
    isFetchingNextPage,
    error,
  } = useNonSuspenseThread({
    castHash,
  });

  return (
    <CastScreenWithCast
      focusedCastFullHashOrPrefix={castHash}
      cachedFocusedCast={cachedFocusedCast}
      mainData={data}
      mainHasNextPage={hasNextPage}
      mainOnEndReached={onEndReached}
      mainFetchingNextPage={isFetchingNextPage}
      mainRefetch={refetch}
      error={error ?? undefined}
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      navigatedFromCastToast={navigatedFromCastToast}
    />
  );
};

type CastScreenWithUsernameAndCastHashPrefixProps = {
  username: string;
  castHashPrefix: CastHashPrefix;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  navigatedFromCastToast?: boolean;
};

const CastScreenWithUsernameAndCastHashPrefix = ({
  username,
  castHashPrefix,
  castOpenIncludeReason,
  sourceOn,
  navigatedFromCastToast,
}: CastScreenWithUsernameAndCastHashPrefixProps) => {
  const {
    data,
    hasNextPage,
    onEndReached,
    refetch,
    isFetchingNextPage,
    error,
  } = useNonSuspenseUserThreadCasts({
    username,
    castHashPrefix,
  });

  const getGloballyCachedCast = useGetGloballyCachedCastWithUsernameAndPrefix({
    username,
    castHashPrefix,
  });

  const cachedFocusedCast = useMemo(
    () => getGloballyCachedCast(),
    [getGloballyCachedCast],
  );

  return (
    <CastScreenWithCast
      focusedCastFullHashOrPrefix={castHashPrefix}
      cachedFocusedCast={cachedFocusedCast}
      mainData={data}
      mainHasNextPage={hasNextPage}
      mainOnEndReached={onEndReached}
      mainFetchingNextPage={isFetchingNextPage}
      mainRefetch={refetch}
      error={error ?? undefined}
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      navigatedFromCastToast={navigatedFromCastToast}
    />
  );
};

interface CastScreenWithCastProps {
  focusedCastFullHashOrPrefix: string;
  cachedFocusedCast: ApiCast | undefined;
  mainData:
    | InfiniteData<ApiGetThread200Response | ApiGetUserThreadCasts200Response>
    | undefined;
  mainHasNextPage: boolean | undefined;
  mainOnEndReached: () => void;
  mainFetchingNextPage: boolean;
  mainRefetch: () => Promise<unknown>;
  error: Error | undefined;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  navigatedFromCastToast?: boolean;
}

const PARENTS_CHUNK_SIZE = 15;
// Cap on mounted ancestor casts. Each parent carries avatar + body + embed
// cells; without a ceiling, scrolling up keeps growing `maxParents`
// indefinitely and inflates the per-visit working set.
const PARENTS_MAX_TOTAL = 60;
const PARENTS_REVEAL_OFFSET_Y = 96;

// Used to explicitly nail the FlatList's contentInset to zero when
// `maintainVisibleContentPosition` is off. RN's MVCP implementation
// manipulates `contentInset.top` on iOS to keep the focused item
// stationary while items are prepended; if the underlying UIScrollView
// gets recycled into a non-MVCP cast detail (or any code path leaks
// inset state across screens), that non-zero inset turns into empty
// scrollable headroom above the focused cast. Forcing inset to zero on
// every render of a non-MVCP path overwrites whatever stale state may
// have leaked in. The React prop alone isn't enough in practice (the
// new-arch UIScrollView retains the native inset across recycles even
// when React's shadow tree thinks it's already 0); see
// `forceContentInsetReset` below for the imperative write.
const NO_CONTENT_INSET = { top: 0, bottom: 0, left: 0, right: 0 };

const CastScreenWithCast = React.memo(
  ({
    focusedCastFullHashOrPrefix,
    cachedFocusedCast,
    castOpenIncludeReason,
    sourceOn,
    mainData,
    mainHasNextPage,
    mainOnEndReached,
    mainFetchingNextPage,
    mainRefetch,
    navigatedFromCastToast,
  }: CastScreenWithCastProps) => {
    const t = useTheme();
    const { trackEvent: trackAnalyticsEvent } = useAnalytics();
    const { trackEvent } = useTrackEvent();
    const prefetchThreadCast = usePrefetchThreadCast();
    // `refetch` from useUserThreadWithHiddenReplies is intentionally
    // not destructured: the cast detail screen no longer surfaces a
    // pull-to-refresh visual (RefreshControl was removed — see the
    // comment near `removeClippedSubviews` on the FlatList for the
    // reasoning). The hook's internal refresh / cache behaviour is
    // unaffected by whether the consumer reads `refetch`.
    const {
      focusedCast,
      threadItems: rawItems,
      onEndReached,
      isFetching,
      showHiddenReplies,
      channel,
      channelDisallowed,
      token,
    } = useUserThreadWithHiddenReplies({
      focusedCastHashPrefix: focusedCastFullHashOrPrefix,
      cachedFocusedCast,
      mainData,
      mainHasNextPage,
      mainOnEndReached,
      mainRefetch,
      castWrapper: getConversationThreadItems,
    });

    const castScreenHeaderOptions = useMemo(
      () => ({
        headerTitle: '',
        headerLeft: () => (
          <CastScreenHeaderLeft castChannel={channel} castToken={token} />
        ),
      }),
      [channel, token],
    );

    const navigation = useNavigation();
    const headerHeight = useHeaderHeight();
    const { top: safeAreaTop } = useSafeAreaInsets();
    const defaultHeaderHeight = getDefaultHeaderHeight(
      Dimensions.get('window'),
      false,
      safeAreaTop,
    );
    const applyFabricInset = isFabricEnabledOnIOS();

    // headerTransparent and headerLeft must land in one setOptions call.
    // Splitting them (shared hook + separate header effect) lets rn-screens
    // inject contentInset.top and stack with paddingTop as a blank gap.
    React.useLayoutEffect(() => {
      const options: NativeStackNavigationOptions = {
        ...castScreenHeaderOptions,
      };
      if (applyFabricInset) {
        options.headerTransparent = true;
        options.headerBackground = () => (
          <View pointerEvents="none" style={StyleSheet.absoluteFill} />
        );
      }
      navigation.setOptions(options);
    }, [applyFabricInset, castScreenHeaderOptions, navigation]);

    const fabricPaddingTop = applyFabricInset
      ? headerHeight || defaultHeaderHeight
      : 0;

    const trackedCastOpenHashRef = useRef<string | undefined>(undefined);

    React.useEffect(() => {
      if (!focusedCast) {
        return;
      }

      if (trackedCastOpenHashRef.current === focusedCast.hash) {
        return;
      }

      trackedCastOpenHashRef.current = focusedCast.hash;

      trackAnalyticsEvent(AnalyticsEvent.CastOpen, {
        castHash: focusedCast.hash,
        author_fid: focusedCast.author.fid,
        ...(castOpenIncludeReason
          ? { includeReason: castOpenIncludeReason }
          : {}),
        ...(sourceOn ? { on: sourceOn } : {}),
      });
    }, [castOpenIncludeReason, focusedCast, sourceOn, trackAnalyticsEvent]);

    const setTabBarTopBorderHidden = useSetTabBarTopBorderHidden();
    React.useLayoutEffect(() => {
      if (typeof focusedCast === 'undefined') {
        return;
      }
      setTabBarTopBorderHidden(true);
      return () => {
        setTabBarTopBorderHidden(false);
      };
    }, [focusedCast, setTabBarTopBorderHidden]);

    const flatListRef = useRef<FlatList<ThreadListItem<ThreadItem>>>(null);

    // Imperative reset of the native UIScrollView's contentInset +
    // scrollIndicatorInsets; see NO_CONTENT_INSET above for why the React
    // prop isn't enough.
    const forceContentInsetReset = useCallback(() => {
      const list = flatListRef.current as unknown as {
        getScrollResponder?: () => unknown;
      } | null;
      const responder = list?.getScrollResponder?.();
      if (!responder) return;
      const setNative = (responder as { setNativeProps?: (p: object) => void })
        .setNativeProps;
      if (typeof setNative !== 'function') return;
      try {
        setNative.call(responder, {
          contentInset: NO_CONTENT_INSET,
          scrollIndicatorInsets: NO_CONTENT_INSET,
        });
      } catch {
        /* native bridge can throw during teardown; no-op */
      }
    }, []);

    const extraData = useCommonFlatListExtraData();

    const focusedIdx = React.useMemo(
      () =>
        rawItems.findIndex(
          (it) => it.type === 'cast' && it.wrappedCast.isFocused,
        ),
      [rawItems],
    );
    const [deferParents, setDeferParents] = React.useState(true);
    const [maxParents, setMaxParents] = React.useState(PARENTS_CHUNK_SIZE);
    const needsBump = React.useRef(false);

    const revealDeferredParents = useCallback(
      (offsetY: number) => {
        if (!deferParents || offsetY > PARENTS_REVEAL_OFFSET_Y) {
          return;
        }
        pendingParentRevealAnchorRef.current = true;
        setDeferParents(false);
      },
      [deferParents],
    );

    const onStartReached = React.useCallback(() => {
      // Reveal parents as soon as FlatList reports we're near the start.
      // Waiting for momentum end makes ancestor casts and their thread line
      // pop in after the pull gesture instead of being part of the drag.
      if (userHasScrolledRef.current) {
        revealDeferredParents(0);
      }
      needsBump.current = true;
    }, [revealDeferredParents]);

    const onMomentumScrollEnd = React.useCallback(
      ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        revealDeferredParents(nativeEvent.contentOffset.y);
        if (needsBump.current && nativeEvent.contentOffset.y <= 0) {
          needsBump.current = false;
          setMaxParents((n) =>
            Math.min(n + PARENTS_CHUNK_SIZE, PARENTS_MAX_TOTAL),
          );
        }
      },
      [revealDeferredParents],
    );

    const threadItems = React.useMemo(() => {
      const parents: ThreadListItem<ThreadItem>[] = [];
      const main: ThreadListItem<ThreadItem>[] = [];
      const replies: ThreadListItem<ThreadItem>[] = [];
      const hiddenReplies: ThreadListItem<ThreadItem>[] = [];

      rawItems.forEach((item, idx) => {
        if (item.type === 'hiddenRepliesHeader') {
          if (item.hiddenRepliesVisible) {
            replies.push(item);
          } else {
            hiddenReplies.push(item);
          }
          return;
        }

        if (idx < focusedIdx) {
          parents.push(item);
        } else if (idx === focusedIdx) {
          main.push(item);
        } else {
          replies.push(item);
        }
      });

      return [
        ...(!deferParents ? parents.slice(-maxParents) : []),
        ...main,
        ...replies,
        ...hiddenReplies,
      ];
    }, [rawItems, focusedIdx, deferParents, maxParents]);

    // Kept for focused-cast onLayout wiring; must not call setDeferParents(false)
    // here — that prepends parents and triggers the upward scroll jump.
    const focusedCastRenderLayout = useCallback(
      (_: LayoutChangeEvent) => {},
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: ThreadListItem<ThreadItem> }) => {
        if (item.type === 'hiddenRepliesHeader') {
          if (item.hiddenRepliesVisible) {
            return (
              <View
                style={[
                  t.flex,
                  t.flexCol,
                  t.itemsStart,
                  t.pX3,
                  t.pT3,
                  { paddingVertical: 10 },
                ]}
              >
                <Text style={t.texts.secondary}>More replies</Text>
              </View>
            );
          } else {
            return (
              <TouchableHighlight
                onPress={() => {
                  trackEvent(AnalyticsEvent.ClickShowHiddenReplies, {});
                  showHiddenReplies();
                }}
                underlayColor={t.colors.bgPillActive}
                style={[
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.pX3,
                  t.pT3,
                  t.mB10,
                  { paddingVertical: 10 },
                ]}
              >
                <FragmentProxy>
                  <UnhideIcon color={t.colors.text.secondary} height={16} />
                  <Text style={[t.texts.secondary, t.mL2]}>
                    Show more replies
                  </Text>
                </FragmentProxy>
              </TouchableHighlight>
            );
          }
        } else {
          const castItem = item.wrappedCast;

          // Ignore FIP-2 token embeds
          if (castIsParentUrlHeader(castItem.cast)) {
            return null;
          }

          const onLayout =
            deferParents && castItem.isFocused
              ? focusedCastRenderLayout
              : undefined;

          return (
            <EventingPropOverrideProvider on={sourceOn}>
              <Pressable
                onLayout={onLayout}
                onPressIn={() => {
                  prefetchThreadCast(item);
                }}
              >
                <Cast
                  cast={castItem.cast}
                  showMoreInfo={castItem.showMoreInfo}
                  threadPosition={castItem.threadPosition}
                  isFocusedCast={castItem.isFocused}
                  expandByDefault={!castItem.isFocused}
                  omitReplyingTo={castItem.omitReplyingTo}
                  showChannelTags={false}
                  hideBottomBorder={castItem.hideBottomBorder}
                  channelDisallowed={channelDisallowed}
                  showMemberBadge={true}
                />
              </Pressable>
              {castItem.showMoreInfo && (
                <ShowMore
                  key={`${castItem.showMoreInfo.hash}:${castItem.cast.replies.casts
                    ?.map((reply) => reply.hash)
                    .join(',')}`}
                  castHash={castItem.showMoreInfo.hash}
                  onPress={castItem.showMoreInfo.onPress}
                  otherParticipants={[]}
                />
              )}
            </EventingPropOverrideProvider>
          );
        }
      },
      [
        channelDisallowed,
        deferParents,
        focusedCastRenderLayout,
        prefetchThreadCast,
        showHiddenReplies,
        sourceOn,
        t.colors.bgPillActive,
        t.colors.text.secondary,
        t.flex,
        t.flexCol,
        t.flexRow,
        t.itemsCenter,
        t.itemsStart,
        t.mB10,
        t.mL2,
        t.pT3,
        t.pX3,
        t.texts.secondary,
        trackEvent,
      ],
    );

    const isFocused = useIsFocused();

    const viewabilityPairsForRecordCastOnView = useRecordThreadItemOnView({
      isFocused,
    });
    const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();
    const viewabilityConfigCallbackPairsRef = React.useRef([
      ...viewabilityPairsForVideos,
      ...viewabilityPairsForRecordCastOnView,
    ]);

    // Viewability doesn't trigger correctly on initial render for the top item
    // in the feed so we manually trigger it here.
    React.useEffect(() => {
      if (!focusedCast || !isFocused) {
        return;
      }

      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        const focusedItem = threadItems.find(
          (item) =>
            item.type === 'cast' &&
            item.wrappedCast.cast.hash === focusedCast.hash,
        );

        if (focusedItem) {
          const simulatedViewTokens = [
            {
              item: focusedItem,
              key: focusedCast.hash,
              index: threadItems.indexOf(focusedItem),
              isViewable: true,
            },
          ];

          viewabilityPairsForVideos.forEach((pair) => {
            pair.onViewableItemsChanged?.({
              viewableItems: simulatedViewTokens,
              changed: simulatedViewTokens,
            });
          });
        }
      }, 200);

      return () => clearTimeout(timer);
    }, [focusedCast, threadItems, isFocused, viewabilityPairsForVideos]);

    const { height: windowHeight } = useWindowDimensions();

    const [hasLaidOut, setHasLaidOut] = React.useState(false);

    // MVCP intentionally disabled.
    //
    // RN's iOS `maintainVisibleContentPosition` implementation tracks
    // the topmost visible item and adjusts `contentOffset` whenever its
    // measured frame moves. In practice this fires on *any* layout
    // change at index ≥ minIndexForVisible, including async image
    // decodes, embed resizes, and FlashList cell recycling on the
    // upstream feed — and when those measurements race the anchor
    // capture, MVCP "preserves" the focused cast at the wrong screen Y
    // and surfaces as a black gap above it (or as the cast slipping
    // past the viewport bottom).
    //
    // We replace MVCP with a deterministic, dataset-keyed snap (see
    // below) that re-pins the focused cast to top on every threadItems
    // / focusedCast change, retried at 0/50/150/350/700/1500ms to
    // absorb any layout race. The user's first touch disarms it
    // (onScrollBeginDrag).
    const maintainVisibleContentPosition = undefined;

    const ThreadFooterComponent = useMemo(() => {
      const extra = navigatedFromCastToast ? 500 : 350;

      const slack = Math.max(0, windowHeight - extra);

      return (
        <View>
          {(isFetching || mainFetchingNextPage) && (
            <ActivityIndicator
              size="small"
              color={t.colors.loadingIndicator}
              style={t.pT4}
            />
          )}
          <View style={{ height: slack }} />
        </View>
      );
    }, [
      isFetching,
      mainFetchingNextPage,
      navigatedFromCastToast,
      t.colors.loadingIndicator,
      t.pT4,
      windowHeight,
    ]);

    // Force `removeClippedSubviews` off on both platforms.
    //
    // The Conversation feed is short (a handful of casts plus parents
    // and a slack footer). With `removeClippedSubviews=true` (RN's iOS
    // default) cells just outside the viewport are unmounted and re-
    // measured when they scroll back in. On iOS those second
    // measurements can differ from the original ones after async embed
    // / image loads, which surfaces as phantom blank space above or
    // below the focused cast (the two repros in the bug report) and
    // also feeds the deterministic snap below stale offsets to chase.
    // Memory cost here is bounded by a handful of replies plus the
    // slack footer, so we trade a tiny bit of memory for more stable
    // layout. This is independent of `maintainVisibleContentPosition`
    // (intentionally disabled — see the MVCP comment above): even with
    // MVCP off, recycled-cell re-measurement still moves contentOffset
    // under the user.
    const removeClippedSubviews = false;

    // Pin the focused cast to the top — strict mode.
    //
    // Each time the dataset state that defines "where the focused cast
    // lives in the list" changes (focusedCast hash, its computed index,
    // the total item count), we schedule snap attempts at
    // 50/150/350/700/1500ms. Multiple attempts are required because:
    //   - rAF on its own runs before iOS has measured async children;
    //   - a single setTimeout(0) misses the second-pass layout that
    //     happens after image decode / embed render lands;
    //   - cells can be re-laid out up to ~1s after first paint when
    //     the screen was reached via deep link (cold cast load).
    // The 0 ms attempt is intentionally omitted: it races the header
    // chrome fix (headerTransparent + paddingTop) and causes a visible
    // upward jump on open. The user's first touch disarms further snaps
    // (onScrollBeginDrag).
    const userHasScrolledRef = useRef(false);
    const userIsDraggingRef = useRef(false);
    const pendingParentRevealAnchorRef = useRef(false);
    const lastSnappedKeyRef = useRef<string | null>(null);
    const mountTimeRef = useRef(Date.now());

    // When parent data arrives, mount it above the focused cast immediately
    // and anchor the focused cast back to the top. This preserves the older
    // smooth pull-down experience (parent + thread line already exist above
    // the viewport) without using focused-cast layout to prepend parents,
    // which was the source of the open-time jump.
    React.useEffect(() => {
      setDeferParents(true);
      setMaxParents(PARENTS_CHUNK_SIZE);
      userHasScrolledRef.current = false;
      userIsDraggingRef.current = false;
      pendingParentRevealAnchorRef.current = false;
      lastSnappedKeyRef.current = null;
      mountTimeRef.current = Date.now();
    }, [focusedCast?.hash]);

    React.useLayoutEffect(() => {
      if (
        !deferParents ||
        focusedIdx <= 0 ||
        userHasScrolledRef.current ||
        (applyFabricInset && fabricPaddingTop <= 0)
      ) {
        return;
      }

      pendingParentRevealAnchorRef.current = true;
      setDeferParents(false);
    }, [applyFabricInset, deferParents, fabricPaddingTop, focusedIdx]);

    React.useLayoutEffect(() => {
      if (
        !pendingParentRevealAnchorRef.current ||
        deferParents ||
        !focusedCast
      ) {
        return;
      }
      if (applyFabricInset && fabricPaddingTop <= 0) {
        return;
      }

      const idx = threadItems.findIndex(
        (it) =>
          it.type === 'cast' && it.wrappedCast.cast.hash === focusedCast.hash,
      );

      if (idx <= 0) {
        pendingParentRevealAnchorRef.current = false;
        return;
      }

      const raf = requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: idx,
          animated: false,
          viewPosition: 0,
          viewOffset: fabricPaddingTop,
        });
        pendingParentRevealAnchorRef.current = false;
      });

      return () => cancelAnimationFrame(raf);
    }, [
      applyFabricInset,
      deferParents,
      fabricPaddingTop,
      focusedCast,
      threadItems,
    ]);

    React.useEffect(() => {
      if (userHasScrolledRef.current) {
        return;
      }
      if (!focusedCast) {
        return;
      }
      const idx = threadItems.findIndex(
        (it) =>
          it.type === 'cast' && it.wrappedCast.cast.hash === focusedCast.hash,
      );
      if (idx < 0) {
        return;
      }
      if (idx > 0 && deferParents) {
        return;
      }
      const key = `${focusedCast.hash}|${idx}|${threadItems.length}`;
      if (lastSnappedKeyRef.current === key) {
        // Same dataset shape we already snapped against. Skip.
        return;
      }
      lastSnappedKeyRef.current = key;

      const snap = () => {
        if (userHasScrolledRef.current) {
          return;
        }
        forceContentInsetReset();
        // For idx 0 we go through scrollToOffset because it doesn't
        // require the row to have been measured yet — the most common
        // path on a fresh mount.
        if (idx === 0) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } else {
          flatListRef.current?.scrollToIndex({
            index: idx,
            animated: false,
            viewPosition: 0,
            viewOffset: fabricPaddingTop,
          });
        }
      };

      // First 1.5s catches the initial native layout + first paint of
      // embeds. The 3-10s tail catches late re-injection from image /
      // video embeds finishing decode and viewability callbacks firing
      // the first time.
      const timers = [50, 150, 350, 700, 1500, 3000, 5000, 10000].map((delay) =>
        setTimeout(snap, delay),
      );
      return () => timers.forEach(clearTimeout);
    }, [
      deferParents,
      fabricPaddingTop,
      focusedCast,
      threadItems,
      forceContentInsetReset,
    ]);

    const onScrollBeginDrag = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        // The user touched the list. Stop fighting them — disarm both the
        // dataset-keyed snap above and the contentSize-change snap below.
        userHasScrolledRef.current = true;
        userIsDraggingRef.current = true;
        revealDeferredParents(e.nativeEvent.contentOffset.y);
      },
      [revealDeferredParents],
    );

    const onScrollEndDrag = React.useCallback(() => {
      userIsDraggingRef.current = false;
    }, []);

    const onScroll = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { nativeEvent } = e;
        if (userIsDraggingRef.current) {
          revealDeferredParents(nativeEvent.contentOffset.y);
        }
      },
      [revealDeferredParents],
    );

    const onContentSizeChange = React.useCallback(
      (_width: number, _height: number) => {
        const elapsedMs = Date.now() - mountTimeRef.current;
        if (elapsedMs < 150) {
          return;
        }
        // A late content-size change (image decode, embed resolve) can
        // momentarily push a non-MVCP UIScrollView into a stale offset.
        // While the user hasn't taken control, re-snap to focusedCast.
        if (userHasScrolledRef.current) {
          return;
        }
        if (!focusedCast) {
          return;
        }
        const idx = threadItems.findIndex(
          (it) =>
            it.type === 'cast' && it.wrappedCast.cast.hash === focusedCast.hash,
        );
        if (idx < 0) {
          return;
        }
        // Only scroll past parent rows when the user explicitly scrolled
        // to the top to reveal them (deferParents false).
        if (idx > 0 && deferParents) {
          return;
        }
        forceContentInsetReset();
        if (idx === 0) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } else {
          flatListRef.current?.scrollToIndex({
            index: idx,
            animated: false,
            viewPosition: 0,
            viewOffset: fabricPaddingTop,
          });
        }
      },
      [
        focusedCast,
        threadItems,
        deferParents,
        fabricPaddingTop,
        forceContentInsetReset,
      ],
    );

    const onScrollToIndexFailed = React.useCallback(
      (info: { index: number; averageItemLength: number }) => {
        // FlatList didn't have the row laid out yet. Approximate the
        // offset from the average measured item height, then retry the
        // exact index after a beat for the precise alignment.
        //
        // Both writes are guarded by `userHasScrolledRef`. The failure
        // callback can fire asynchronously after a snap attempt
        // initiated `scrollToIndex` and the user has since started
        // dragging (which permanently disarms snapping via
        // `onScrollBeginDrag`). Without these guards, the fallback
        // would programmatically jump the list out from under the
        // user's finger.
        if (
          userHasScrolledRef.current &&
          !pendingParentRevealAnchorRef.current
        ) {
          return;
        }
        const offset = info.averageItemLength * info.index;
        flatListRef.current?.scrollToOffset({ offset, animated: false });
        setTimeout(() => {
          if (
            userHasScrolledRef.current &&
            !pendingParentRevealAnchorRef.current
          ) {
            return;
          }
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
            viewPosition: 0,
            viewOffset: fabricPaddingTop,
          });
          pendingParentRevealAnchorRef.current = false;
        }, 100);
      },
      [fabricPaddingTop],
    );

    const isWithinTabNavigator = useIsWithinTabNavigator();
    return useMemo(() => {
      const content = (
        <AnimatedImageViewabilityScopeProvider>
          <FlatList
            // Plain RN FlatList here — not Animated.FlatList — because
            // there's no animated scroll handler or shared value on
            // this screen, and Reanimated's `createAnimatedComponent`
            // wrapper has been observed to drop iOS-specific scroll-
            // view props (contentInsetAdjustmentBehavior,
            // automaticallyAdjustContentInsets) on the way through,
            // which is what was letting the nav-bar auto-inset re-
            // appear as a black gap above the focused cast.
            maintainVisibleContentPosition={maintainVisibleContentPosition}
            contentInset={
              maintainVisibleContentPosition ? undefined : NO_CONTENT_INSET
            }
            contentContainerStyle={
              fabricPaddingTop > 0
                ? { paddingTop: fabricPaddingTop }
                : undefined
            }
            // The Cast screen lives inside a native-stack navigator
            // (UINavigationController under the hood). iOS's default
            // behavior is to silently add the nav-bar height to the
            // ScrollView's contentInset.top so content doesn't render
            // under the bar — but react-navigation already positions
            // the content below the bar, so this auto-inset stacks on
            // top of the existing layout and shows up as empty
            // scrollable headroom above the focused cast (especially
            // visible when the thread is short and the user can over-
            // scroll). Both props are required: `…AdjustmentBehavior`
            // is the modern iOS API; `automaticallyAdjustContentInsets`
            // is the legacy fallback older RN versions still consult.
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            // Belt-and-suspenders against a horizontal pan / bounce
            // sneaking through. `directionalLockEnabled` only locks
            // direction *within* an active gesture — it does not stop
            // iOS from interpreting a diagonal swipe as horizontal
            // movement on its own. A vertical FlatList has no
            // horizontal content, so disabling horizontal bounce
            // explicitly keeps the cast from drifting left/right under
            // any input.
            alwaysBounceHorizontal={false}
            // RefreshControl deliberately omitted on the Cast detail
            // screen.
            //
            // After heavy feed scrolling, RefreshControl on iOS has been
            // observed to leave `contentInset.top` elevated by ~refresh-
            // height when its `refreshing` flag falls out of sync with
            // the underlying UIRefreshControl state. Because
            // `contentInsetAdjustmentBehavior="never"` only opts out of
            // *automatic* nav-bar adjustment, it does not override what
            // RefreshControl writes to contentInset itself. The result
            // is the persistent black gap above the focused cast on
            // every fresh push of the screen ("after a few minutes of
            // scrolling, every cast opens with empty space above").
            // Pull-to-refresh on a single-cast detail page is rarely
            // used; the underlying thread query still refetches via
            // its normal cache-invalidation path, we just no longer
            // surface a visual control here.
            removeClippedSubviews={removeClippedSubviews}
            data={threadItems}
            extraData={extraData}
            keyExtractor={extractThreadListItemKey}
            renderItem={renderItem}
            ref={flatListRef}
            onEndReached={onEndReached}
            onScroll={onScroll}
            scrollEventThrottle={Platform.OS === 'ios' ? 32 : 16}
            onMomentumScrollEnd={onMomentumScrollEnd}
            onEndReachedThreshold={onEndReachedThreshold}
            onStartReached={onStartReached}
            onStartReachedThreshold={onEndReachedThreshold}
            onContentSizeChange={onContentSizeChange}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            viewabilityConfigCallbackPairs={
              viewabilityConfigCallbackPairsRef.current
            }
            ListFooterComponent={ThreadFooterComponent}
            onScrollToIndexFailed={onScrollToIndexFailed}
            directionalLockEnabled={true}
            onLayout={() => {
              forceContentInsetReset();
              if (!hasLaidOut) {
                setHasLaidOut(true);
              }
            }}
          />
          {focusedCast &&
            focusedCast.author &&
            focusedCast.author.viewerContext?.blockedBy !== true &&
            focusedCast.replyDisabled !== true && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <CastScreenQuickReply cast={focusedCast} />
              </KeyboardAvoidingView>
            )}
        </AnimatedImageViewabilityScopeProvider>
      );
      if (isWithinTabNavigator) {
        return (
          <EventingProvider on="conversation">
            <View style={[t.hFull, { flex: 1, overflow: 'hidden' }]}>
              {content}
            </View>
          </EventingProvider>
        );
      } else {
        return (
          <EventingProvider on="conversation">
            <View style={[t.hFull, { flex: 1, overflow: 'hidden' }]}>
              <SafeAreaView style={[t.hFull]} edges={['bottom']}>
                {content}
              </SafeAreaView>
            </View>
          </EventingProvider>
        );
      }
    }, [
      ThreadFooterComponent,
      extraData,
      fabricPaddingTop,
      focusedCast,
      forceContentInsetReset,
      hasLaidOut,
      isWithinTabNavigator,
      maintainVisibleContentPosition,
      onContentSizeChange,
      onEndReached,
      onMomentumScrollEnd,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onScrollToIndexFailed,
      onStartReached,
      removeClippedSubviews,
      renderItem,
      t.hFull,
      threadItems,
    ]);
  },
);

CastScreenWithCast.displayName = 'CastScreenWithCast';

export { CastScreen, CastScreenWithCast };
