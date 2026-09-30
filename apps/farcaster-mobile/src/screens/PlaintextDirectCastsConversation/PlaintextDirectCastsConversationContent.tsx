import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCalendars } from 'expo-localization';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import { extractDirectCastKey } from 'farcaster-client-hooks';
import { Typography } from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { LoadFailureIndicator } from '~/components/LoadFailureIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDirectCastsAnimationsHistory } from '~/contexts/DirectCastsAnimationsHistoryProvider';
import { useDirectCastsConversationMessages } from '~/contexts/DirectCastsConversationMessagesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { trackError } from '~/utils/ErrorUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { DirectCastMessageContainer } from './DirectCastMessageContainer';
import { ConversationPinnedMessages } from './PinnedMessages';
import { SetReplyTo } from './PlaintextDirectCastsConversationScreen';
import { ScrollDownPressable } from './ScrollDownPressable';

const LIST_BATCH_SIZE = 10;

const FlatList = Animated.FlatList;

function onScrollToIndexFailed() {}

const maintainVisibleContentPosition = {
  minIndexForVisible: 0,
};

export type MessagesListInterface = {
  prepareForNewMessage: () => void;
  scrollToEnd: (force?: boolean) => void;
};

type PlaintextDirectCastsConversationContentProps = {
  conversationId: string;
  conversationHasPinnedMessages: boolean;
  conversationIsGroup: boolean;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  viewerCanPinMessages: boolean;
  currentUserFid: number;
  setReplyTo: SetReplyTo;
  messagesListRef: React.Ref<MessagesListInterface>;
  ListHeaderComponent: React.ReactElement | undefined;
  isOptimistic?: boolean;
  focusOnMessageId?: string | undefined;
};

const PlaintextDirectCastsConversationContent: React.FC<PlaintextDirectCastsConversationContentProps> =
  React.memo(
    ({
      conversationId,
      conversationHasPinnedMessages,
      conversationIsGroup,
      conversationIsMuted,
      conversationOtherPartyLastReadTime,
      viewerCanPinMessages,
      currentUserFid,
      setReplyTo,
      messagesListRef,
      ListHeaderComponent,
      isOptimistic,
      focusOnMessageId,
    }) => {
      const {
        conversationState,
        fetchNewerMessages,
        fetchOlderMessages,
        hasNewerMessages,
        refetchFullConversation,
        load,
        hasOlderMessages,
        isFetchingOlderMessages,
        error,
        isError,
      } = useDirectCastsConversationMessages();

      // error isn't cleared when the retry button is pressed so created a separate
      // state-based error so we can clear it on button press so the failure indicator
      // doesn't render.
      const [fetchError, setFetchError] = useState<Error | null>(error);
      useEffect(() => {
        setFetchError(error);
      }, [error]);

      const messages = React.useMemo(
        () => uniqBy(conversationState.messages, extractDirectCastKey),
        [conversationState.messages],
      );

      const {
        displayedItems: displayedMessages,
        handleEndReached: handleEndReachedFromHelper,
      } = useDisplayLimit({
        data: messages,
        batchSize: LIST_BATCH_SIZE,
        hasNextPage: hasOlderMessages,
        isFetching: isFetchingOlderMessages,
        fetchNextPage: fetchOlderMessages,
      });

      const handleEndReached = React.useCallback(() => {
        setFetchError(null);
        handleEndReachedFromHelper();
      }, [handleEndReachedFromHelper]);

      const { trackEvent } = useAnalytics();

      const t = useTheme();

      const extraData = useCommonFlatListExtraData();

      const flatListRef =
        React.useRef<RNFlatList<ApiDirectCastMessageV3>>(null);
      const isFocused = useIsFocused();
      useForceZeroScrollInsets({
        ref: flatListRef,
        enabled: isFocused,
      });

      const [isAtTop, setIsAtTop] = React.useState<boolean>(
        !conversationState.shouldRenderUnreadMarkerMessageId,
      );

      const [shouldShowScrollDownPressable, setShouldShowScrollDownPressable] =
        React.useState<boolean>(false);

      // Gate scroll-driven setStates on threshold crossings only. Inverted
      // FlatList fires onScroll every frame; calling setState on every frame
      // is the dominant source of scroll-time JS work on Android.
      // Tracks whether the user is pinned to the EXACT bottom (newest
      // message flush against the composer). Distinct from `isAtTop`'s
      // generous 225px threshold: used to decide whether a height-only cell
      // growth should re-pin to the bottom. Seeded to "at bottom" unless we
      // open onto an unread marker (which scrolls away from the bottom).
      const atExactBottomRef = React.useRef<boolean>(
        !conversationState.shouldRenderUnreadMarkerMessageId,
      );

      const onScroll = React.useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = e.nativeEvent.contentOffset.y;
          const atTop = y <= 225;
          const showScrollDown = y >= 225;
          atExactBottomRef.current = y <= 8;
          setIsAtTop((prev) => (prev === atTop ? prev : atTop));
          setShouldShowScrollDownPressable((prev) =>
            prev === showScrollDown ? prev : showScrollDown,
          );
        },
        [],
      );

      const opacity = useSharedValue(1);
      const scrollingRef = React.useRef<boolean>(false);

      const onScrollBeginDrag = React.useCallback(() => {
        opacity.value = 1;
        scrollingRef.current = true;
        setDisplayScrollDate(true);
      }, [opacity]);

      const onMomentumScrollEnd = React.useCallback(() => {
        scrollingRef.current = false;
        opacity.value = withTiming(0, { duration: 200 });
        setDisplayScrollDate(false);
      }, [opacity]);

      React.useEffect(() => {
        setIsAtTop(!conversationState.shouldRenderUnreadMarkerMessageId);
      }, [conversationState.shouldRenderUnreadMarkerMessageId, setIsAtTop]);

      const scrollToLatestMessage = React.useCallback(() => {
        if (messages.length && isAtTop) {
          flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        }
      }, [messages.length, isAtTop]);

      React.useImperativeHandle(messagesListRef, () => {
        return {
          prepareForNewMessage: () => {
            // No-op for FlatList but if we move back to FlashList we need to prepare the layout
            // for animation.
            // See: https://shopify.github.io/flash-list/docs/guides/layout-animation
          },
          scrollToEnd: (force?: boolean) => {
            if (force) {
              setTimeout(() => {
                const list = flatListRef.current;
                if (list && (list.props.data?.length ?? 0) > 0) {
                  list.scrollToIndex({ index: 0, animated: true });
                }
              }, 10);
            } else {
              scrollToLatestMessage();
            }
          },
        };
      });

      useFocusEffect(
        React.useCallback(() => {
          const showKeyboardEventCallback = Keyboard.addListener(
            'keyboardDidShow',
            scrollToLatestMessage,
          );

          return () => {
            showKeyboardEventCallback.remove();
          };
        }, [scrollToLatestMessage]),
      );

      const scrollToIndex = React.useCallback(
        ({
          index,
          animated,
          viewPosition,
          viewOffset,
        }: {
          index: number;
          animated: boolean;
          viewPosition: number | undefined;
          viewOffset: number | undefined;
        }) => {
          try {
            // FIXME: Adding another 1 count less for buffer since we are seeing some odd cases
            // on production around 49 items and index of 50. To be investigated further later.
            // We are also seeing when this is invoked but possibly messages are not populated on
            // the state context yet.
            if (
              index > -1 &&
              index < messages.length - 1 &&
              messages.length !== 0 &&
              typeof flatListRef.current?.props.data?.length !== 'undefined' &&
              index < flatListRef.current?.props.data?.length - 1
            ) {
              flatListRef.current?.scrollToIndex({
                animated: animated,
                viewPosition: viewPosition,
                viewOffset: viewOffset,
                index: index,
              });
            }
          } catch (e) {
            // Let's just have the scroll be a no-op and log the error since
            // it's currently crashing the app.
            trackError(e);
          }
        },
        [messages.length],
      );

      const prevContentHeight = React.useRef(0);
      const prevItemCount = React.useRef(0);
      const scrolledUnreadMarkerIndex = React.useRef(0);
      const containerHeight = React.useRef(0);

      const onContentSizeChange = React.useCallback(
        (_: number, height: number) => {
          if (
            conversationState.focusedMessageIndex !== 0 &&
            typeof conversationState.shouldRenderUnreadMarkerMessageId !==
              'undefined' &&
            scrolledUnreadMarkerIndex.current !==
              conversationState.focusedMessageIndex
          ) {
            // Landing on the unread marker means we are not at the bottom;
            // don't let a subsequent height-growth re-pin yank us down.
            atExactBottomRef.current = false;
            requestAnimationFrame(() => {
              scrollToIndex({
                index: conversationState.focusedMessageIndex,
                animated: false,
                viewOffset: 0,
                viewPosition: 0.5,
              });
            });

            scrolledUnreadMarkerIndex.current =
              conversationState.focusedMessageIndex;

            return;
          }

          // Only auto-snap to bottom when a NEW message actually arrives.
          // Height-only triggers (16–50px buffer for emoji-reaction adds) fire
          // every time a reaction emoji image lazy-loads from disk cache —
          // we measured 140+ image loads in ~75s on a busy DC, which made
          // the screen visibly auto-scroll down every ~1s. `maintainVisible
          // ContentPosition` keeps the visible bubble pinned anyway when a
          // reaction grows a cell, so the only behavior loss is that adding
          // a reaction to a message that's already off-screen won't pull it
          // back into view (it can be scrolled to manually).
          const itemsCountIncreased = messages.length > prevItemCount.current;
          const contentGrew = height > prevContentHeight.current;

          if (
            isAtTop &&
            !hasNewerMessages &&
            itemsCountIncreased &&
            // Guard against the brand-new / optimistic DM case where
            // `data=[]`: `scrollToIndex` would throw "out of range" and
            // crash the JS thread.
            displayedMessages.length > 0
          ) {
            atExactBottomRef.current = true;
            flatListRef.current?.scrollToIndex({ index: 0, animated: true });
          } else if (
            // Height-only growth of the bottom cell right after the open-snap
            // (avatar / timestamp / reaction / embed finishing async layout,
            // ~16–50px) was pushing the newest bubble partly under the
            // composer — the "message getting cut off on open" bug. Re-pin to
            // the bottom, but ONLY when the user is pinned to the exact bottom,
            // and with a NON-animated correction so it stays imperceptible.
            // This is deliberately narrower than the old height-diff snap
            // (#10191): gating on `atExactBottomRef` (not the 225px `isAtTop`)
            // + no animation avoids the busy-DM "auto-scroll every ~1s" jitter
            // that reaction-image loads used to cause.
            contentGrew &&
            atExactBottomRef.current &&
            !hasNewerMessages &&
            displayedMessages.length > 0
          ) {
            flatListRef.current?.scrollToIndex({ index: 0, animated: false });
          }

          prevContentHeight.current = height;
          prevItemCount.current = messages.length;
        },
        [
          conversationState.focusedMessageIndex,
          displayedMessages.length,
          messages.length,
          conversationState.shouldRenderUnreadMarkerMessageId,
          hasNewerMessages,
          isAtTop,
          scrollToIndex,
        ],
      );

      const { updateHighlightedMessage } = useDirectCastsAnimationsHistory();

      const navigateToMessageInTimeline = React.useCallback(
        ({
          messageId,
          animated,
        }: {
          messageId: string;
          animated?: boolean;
        }) => {
          // Any jump-to-message (reply-preview tap, pinned-message tap,
          // route-level focusOnMessageId) moves us away from the bottom to a
          // centered target. Clear the exact-bottom flag up front so a
          // height-only growth that fires before onScroll catches up can't
          // snap us back to index 0 and undo the navigation.
          atExactBottomRef.current = false;

          const existingIndexInMessages = messages.findIndex(
            (o) => o.messageId === messageId,
          );

          if (existingIndexInMessages !== -1) {
            requestAnimationFrame(() => {
              scrollToIndex({
                index: existingIndexInMessages,
                animated: animated ?? true,
                viewOffset: 0,
                viewPosition: 0.5,
              });
              setWaitingForFocus(false);
            });
          } else {
            const { scrollToIndex: targetIndex } = load({
              messageId,
            });

            requestAnimationFrame(() => {
              scrollToIndex({
                index: targetIndex,
                animated: animated ?? false,
                viewOffset: 0,
                viewPosition: 0.5,
              });
              setWaitingForFocus(false);
            });
          }

          updateHighlightedMessage({ messageId });
        },
        [load, messages, scrollToIndex, updateHighlightedMessage],
      );

      const scrollToReply = React.useCallback(
        ({ messageId: replyMessageId }: { messageId: string }) => {
          trackEvent(AnalyticsEvent.ClickRepliedDirectCast, {});

          navigateToMessageInTimeline({ messageId: replyMessageId });
        },
        [navigateToMessageInTimeline, trackEvent],
      );

      const [waitingForFocus, setWaitingForFocus] =
        React.useState(!!focusOnMessageId);
      const focusOnMessageIdStartedRef = React.useRef(false);
      React.useEffect(() => {
        if (
          !waitingForFocus ||
          !focusOnMessageId ||
          focusOnMessageIdStartedRef.current
        ) {
          return;
        }
        focusOnMessageIdStartedRef.current = true;
        // Opening on a search/deep-link target means we are leaving the bottom;
        // keep height-only layout changes from re-pinning before onScroll lands.
        atExactBottomRef.current = false;
        requestAnimationFrame(() => {
          navigateToMessageInTimeline({
            messageId: focusOnMessageId,
            animated: false,
          });
        });
      }, [focusOnMessageId, waitingForFocus, navigateToMessageInTimeline]);

      const renderItem = React.useCallback(
        ({ item, index }: { item: ApiDirectCastMessageV3; index: number }) => {
          // The indexing may see odd at first look. This is due to having
          // our direct casts ordered in reverse.
          const getPrevDirectCast = (): ApiDirectCastMessageV3 | undefined =>
            messages[index + 1];
          const getNextDirectCast = (): ApiDirectCastMessageV3 | undefined =>
            messages[index - 1];

          const previousDirectCast = getPrevDirectCast();
          const nextDirectCast = getNextDirectCast();

          const shouldRenderNewMessageMarker =
            conversationState.shouldRenderUnreadMarkerMessageId ===
            item.messageId;

          return (
            <DirectCastMessageContainer
              conversationHasPinnedMessages={conversationHasPinnedMessages}
              conversationIsGroup={conversationIsGroup}
              conversationIsMuted={conversationIsMuted}
              conversationOtherPartyLastReadTime={
                conversationOtherPartyLastReadTime
              }
              viewerCanPinMessages={viewerCanPinMessages}
              currentUserFid={currentUserFid}
              conversationId={conversationId}
              shouldRenderNewMessageMarker={shouldRenderNewMessageMarker}
              message={item}
              nextMessage={nextDirectCast}
              previousMessage={previousDirectCast}
              wrappingListIndex={index}
              setReplyTo={setReplyTo}
              onScrollToReply={scrollToReply}
            />
          );
        },
        [
          conversationHasPinnedMessages,
          conversationId,
          conversationIsGroup,
          conversationIsMuted,
          conversationOtherPartyLastReadTime,
          messages,
          conversationState.shouldRenderUnreadMarkerMessageId,
          currentUserFid,
          scrollToReply,
          setReplyTo,
          viewerCanPinMessages,
        ],
      );

      // This is managing a odd corner case where when we land on the list we don't want to attempt a quick
      // fetch on the bottom. So this flag covers for that specific case and delays the fetch.
      const [onStartReachedEnabled, setOnStartReachedEnabled] =
        React.useState<boolean>(false);

      React.useEffect(() => {
        let hasUnmounted = false;
        setTimeout(() => {
          if (!hasUnmounted) {
            setOnStartReachedEnabled(true);
          }
        }, 1000);
        return () => {
          hasUnmounted = true;
        };
      }, []);

      const onStartReached = React.useCallback(() => {
        fetchNewerMessages();
      }, [fetchNewerMessages]);

      const showScrollDownButton = React.useMemo(() => {
        return hasNewerMessages || shouldShowScrollDownPressable;
      }, [hasNewerMessages, shouldShowScrollDownPressable]);

      const onScrollDownButtonPress = React.useCallback(() => {
        if (hasNewerMessages) {
          refetchFullConversation();
        }

        // Defensive: 300ms is long enough that a concurrent
        // `refetchFullConversation` could clear `messages` before the
        // timer fires. Same `scrollToIndex` empty-list crash applies.
        setTimeout(() => {
          const list = flatListRef.current;
          if (list && (list.props.data?.length ?? 0) > 0) {
            list.scrollToIndex({ index: 0, animated: true });
          }
        }, 300);
      }, [hasNewerMessages, refetchFullConversation]);

      const [displayScrollDate, setDisplayScrollDate] =
        React.useState<boolean>(false);

      const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        containerHeight.current = e.nativeEvent.layout.height;
      }, []);

      const [topItemIndex, setTopItemIndex] = React.useState<number | null>(
        null,
      );
      // Stable identity: an inline arrow here makes the inverted FlatList
      // re-wrap its viewability tracking on every parent re-render (incoming
      // message, keyboard event, inset-reset timer). A bounded callback keeps
      // viewability tracking stable across those re-renders.
      const onViewableItemsChanged = React.useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
          setTopItemIndex(
            viewableItems?.[viewableItems.length - 1]?.index ?? null,
          );
        },
        [],
      );
      const messagesLength = messages.length;
      const listFooterComponent = React.useMemo(
        () =>
          !isOptimistic || messagesLength > 0 ? (
            fetchError ? (
              <View style={[t.h24, t.mT16]}>
                <LoadFailureIndicator retry={handleEndReached} />
              </View>
            ) : hasOlderMessages && isFetchingOlderMessages ? (
              // Inverted list: gate on in-flight flag, else this is a
              // perpetual top-of-chat spinner.
              <LoadingIndicator style={[t.h24, t.mT16]} />
            ) : null
          ) : null,
        [
          isOptimistic,
          messagesLength,
          fetchError,
          t.h24,
          t.mT16,
          handleEndReached,
          hasOlderMessages,
          isFetchingOlderMessages,
        ],
      );
      const calendars = useCalendars();

      const getFormattedScrollDate = React.useCallback(
        ({ messageDate }: { messageDate: Date }) => {
          const timeZone = calendars?.[0]?.timeZone || undefined;

          const now = new Date();

          // Get year, month, day in the target timezone for both dates
          const nowYear = parseInt(
            now.toLocaleDateString('en-US', { timeZone, year: 'numeric' }),
          );
          const nowMonth = parseInt(
            now.toLocaleDateString('en-US', { timeZone, month: 'numeric' }),
          );
          const nowDay = parseInt(
            now.toLocaleDateString('en-US', { timeZone, day: 'numeric' }),
          );

          const msgYear = parseInt(
            messageDate.toLocaleDateString('en-US', {
              timeZone,
              year: 'numeric',
            }),
          );
          const msgMonth = parseInt(
            messageDate.toLocaleDateString('en-US', {
              timeZone,
              month: 'numeric',
            }),
          );
          const msgDay = parseInt(
            messageDate.toLocaleDateString('en-US', {
              timeZone,
              day: 'numeric',
            }),
          );

          // Create dates for comparison (using UTC to avoid timezone issues)
          const nowDayStart = Date.UTC(nowYear, nowMonth - 1, nowDay);
          const msgDayStart = Date.UTC(msgYear, msgMonth - 1, msgDay);

          // Calculate difference in days
          const diffInMs = nowDayStart - msgDayStart;
          const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

          if (diffInDays === 0) {
            return 'Today';
          } else if (diffInDays === 1) {
            return 'Yesterday';
          } else if (diffInDays < 7) {
            // Format as "ddd, MMM D"
            return messageDate.toLocaleDateString('en-US', {
              timeZone,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          } else {
            // Format as "MMM D, YYYY"
            return messageDate.toLocaleDateString('en-US', {
              timeZone,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          }
        },
        [calendars],
      );

      const formattedScrollDate = React.useMemo(() => {
        if (topItemIndex === null) return null;

        const message = displayedMessages[topItemIndex];

        if (!message) return null;

        const messageDate = new Date(message.serverTimestamp);

        try {
          return getFormattedScrollDate({ messageDate });
        } catch {
          const mt = moment(message.serverTimestamp);
          return mt.calendar(null, {
            sameDay: 'h:mm A',
            lastDay: '[Yesterday]',
            sameWeek: 'ddd',
            lastWeek: 'M/D/YY',
            sameElse: 'M/D/YY',
          });
        }
      }, [displayedMessages, getFormattedScrollDate, topItemIndex]);

      const dismissKeyboard = React.useCallback(() => {
        Keyboard.dismiss();
      }, []);

      const animatedDateStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
        };
      }, [opacity]);

      if (!isOptimistic && messages.length === 0) {
        if (fetchError) {
          return (
            <View style={[t.hFull]}>
              <LoadFailureIndicator
                style={[t.flex1, t.itemsCenter]}
                retry={() => {
                  setFetchError(null);
                  fetchNewerMessages();
                }}
              />
            </View>
          );
        } else if (!isError && conversationState.isLoading) {
          return (
            <View style={[t.hFull]}>
              <LoadingIndicator
                style={[t.flex1, t.justifyCenter, t.itemsCenter]}
              />
            </View>
          );
        }
      }

      return (
        <>
          <ConversationPinnedMessages
            currentUserFid={currentUserFid}
            onPinnedMessagePress={navigateToMessageInTimeline}
          />
          <View style={t.flex1}>
            <FlatList
              onContentSizeChange={onContentSizeChange}
              onLayout={onLayout}
              ref={flatListRef}
              data={displayedMessages}
              renderItem={renderItem}
              keyExtractor={extractDirectCastKey}
              {...ZERO_SCROLL_INSET_PROPS}
              maintainVisibleContentPosition={maintainVisibleContentPosition}
              // Virtualization is ON with a bounded `windowSize` so the mounted
              // cell count -- and therefore per-frame main-thread layout cost --
              // stays flat no matter how far back the user scrolls. It was
              // previously disabled to dodge inverted + maintainVisibleContent
              // Position recycler jitter, but that traded the jitter for an
              // unbounded mounted view tree: measured frame jank climbed from
              // ~17% to ~93% over 60s of scroll-up as the "Slow UI thread"
              // layout work grew linearly with the number of mounted messages.
              // A small `windowSize` + `maxToRenderPerBatch` keeps each update
              // cheap, which also avoids the old "large list slow to update"
              // gaps that motivated turning virtualization off.
              windowSize={9}
              onViewableItemsChanged={onViewableItemsChanged}
              initialNumToRender={15}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={false}
              scrollEventThrottle={16}
              onStartReached={
                onStartReachedEnabled ? onStartReached : undefined
              }
              onEndReachedThreshold={0.35}
              onEndReached={handleEndReached}
              inverted={true}
              onScrollToIndexFailed={onScrollToIndexFailed}
              extraData={extraData}
              onMomentumScrollBegin={
                Platform.OS === 'android' ? undefined : dismissKeyboard
              }
              onScrollEndDrag={
                Platform.OS === 'android' ? dismissKeyboard : undefined
              }
              onScroll={onScroll}
              onScrollBeginDrag={onScrollBeginDrag}
              onMomentumScrollEnd={onMomentumScrollEnd}
              ListHeaderComponent={ListHeaderComponent}
              ListFooterComponent={listFooterComponent}
            />
            {displayScrollDate && formattedScrollDate !== null && (
              <View style={[t.absolute, t.selfCenter]}>
                <Animated.View
                  style={[
                    t.p3,
                    t.mT1,
                    t.backgrounds.brandLight,
                    t.roundedFull,
                    animatedDateStyle,
                  ]}
                >
                  <Typography label="Body/ExtraSmall">
                    {formattedScrollDate}
                  </Typography>
                </Animated.View>
              </View>
            )}
          </View>
          {showScrollDownButton && (
            <ScrollDownPressable onPress={onScrollDownButtonPress} />
          )}
          {waitingForFocus && (
            <View
              style={[
                t.absolute,
                t.inset0,
                t.bgDefault,
                t.justifyCenter,
                t.itemsCenter,
              ]}
            >
              <ActivityIndicator size="large" />
            </View>
          )}
        </>
      );
    },
  );

PlaintextDirectCastsConversationContent.displayName =
  'PlaintextDirectCastsConversationContent';

export { PlaintextDirectCastsConversationContent };
