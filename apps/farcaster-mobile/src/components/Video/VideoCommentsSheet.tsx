import {
  BottomSheetFooter,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import {
  useNonSuspenseThread,
  useOptimisticallyAddNewCastToThread,
} from 'farcaster-client-hooks';
import debounce from 'lodash/debounce';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { FlatList as GestureFlatList } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Text2 } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { VideoComment } from './VideoComment';
import { VideoCommentComposer } from './VideoCommentComposer';

interface VideoCommentsSheetProps {
  cast: ApiCast;
  onDismiss?: ({ navigatedAway }: { navigatedAway: boolean }) => void;
}

const screenHeight = Dimensions.get('window').height;
const DEFAULT_COMPOSER_HEIGHT = 84;
const MIN_HEIGHT = 84;

const List = Platform.OS === 'android' ? GestureFlatList : FlatList;

const VideoCommentsSheet = memo(
  ({ cast, onDismiss }: VideoCommentsSheetProps) => {
    const t = useTheme();
    const inset = useSafeAreaInsets();
    const toast = useToast();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const insetBottom = inset.bottom / 2;

    // Calculate initial height to prevent layout jump
    const initialBottomSheetPosition = screenHeight * 0.4;
    const initialHeight = Math.max(
      screenHeight -
        initialBottomSheetPosition -
        MIN_HEIGHT -
        DEFAULT_COMPOSER_HEIGHT -
        insetBottom,
      100,
    );

    const commentsHeight = useSharedValue(initialHeight);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const animatedFooterTransform = useSharedValue(0);
    const [bottomSheetPosition, setBottomSheetPosition] = useState(
      initialBottomSheetPosition,
    );
    const isInitialMount = useRef(true);
    const [mentionsPanelVisible, setMentionsPanelVisible] = useState(false);
    const {
      data: threadData,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      isLoading,
    } = useNonSuspenseThread({
      castHash: cast.hash,
    });

    const optimisticallyAddNewCastToThread =
      useOptimisticallyAddNewCastToThread('top');

    const comments = useMemo(() => {
      if (!threadData?.pages) {
        return [];
      }

      const allItems = threadData.pages.flatMap((page) => page.result.casts);

      return allItems.filter(
        (item) =>
          item.parentHash === cast.hash &&
          !item.deleted &&
          item.text.length > 0,
      );
    }, [threadData, cast.hash]);

    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.VideoFeedCommentsView);
    }, [trackEvent]);

    // Keyboard height detection
    useEffect(() => {
      const keyboardWillShowListener = Keyboard.addListener(
        'keyboardWillShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        },
      );

      const keyboardWillHideListener = Keyboard.addListener(
        'keyboardWillHide',
        () => {
          setKeyboardHeight(0);
        },
      );

      // For Android, use keyboardDidShow/Hide
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          if (Platform.OS === 'android') {
            // Animate the footer up by the keyboard height
            animatedFooterTransform.value = withTiming(
              -e.endCoordinates.height,
              {
                duration: 250,
              },
            );
          }
        },
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
          if (Platform.OS === 'android') {
            // Animate the footer back down
            animatedFooterTransform.value = withTiming(0, {
              duration: 250,
            });
          }
        },
      );

      return () => {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }, [animatedFooterTransform]);

    const [navigatedAway, setNavigatedAway] = useState(false);

    const handleNavigateFromComments = useCallback(() => {
      setNavigatedAway(true);
      bottomSheetRef.current?.dismiss();
    }, [setNavigatedAway]);

    const handleDismiss = useCallback(() => {
      onDismiss?.({ navigatedAway });
    }, [onDismiss, navigatedAway]);

    const handleComposerSuccess = useCallback(
      ({ cast: newCast }: { cast: ApiCast }) => {
        trackEvent(AnalyticsEvent.VideoFeedCommentSubmit);
        optimisticallyAddNewCastToThread({
          parentCastHash: cast.hash,
          cast: newCast,
        });
      },
      [optimisticallyAddNewCastToThread, cast.hash, trackEvent],
    );

    const handleComposerError = useCallback(() => {
      toast.show('Failed to post comment, please try again', {
        placement: 'top',
        type: 'danger',
      });
    }, [toast]);

    const renderItem = useCallback(
      ({ item }: { item: ApiCast }) => {
        return (
          <VideoComment cast={item} onNavigate={handleNavigateFromComments} />
        );
      },
      [handleNavigateFromComments],
    );

    const keyExtractor = useCallback((item: ApiCast) => item.hash, []);

    const ListEmptyComponent = useMemo(() => {
      if (isLoading) {
        return (
          <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pY8]}>
            <ActivityIndicator size="small" color={t.colors.text.tertiary} />
          </View>
        );
      }

      return (
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pY8]}>
          <Text2 color="secondary" size="base">
            No comments yet
          </Text2>
        </View>
      );
    }, [isLoading, t]);

    const ListFooterComponent = useMemo(() => {
      if (!hasNextPage) {
        return <View style={{ height: 12 }} />;
      }

      if (!isFetchingNextPage) {
        return null;
      }

      return (
        <View style={[t.pY3, t.itemsCenter]}>
          <ActivityIndicator size="small" color={t.colors.text.tertiary} />
        </View>
      );
    }, [hasNextPage, isFetchingNextPage, t]);

    const updateCommentsHeight = useMemo(
      () =>
        debounce(
          (
            position: number,
            keyboard: number,
            composer: number,
            skipAnimation: boolean,
          ) => {
            const availableHeight =
              screenHeight -
              position -
              MIN_HEIGHT -
              composer -
              (keyboard > 0 ? keyboard + insetBottom : insetBottom) -
              (Platform.OS === 'android' ? insetBottom : 0);
            const nextHeight = Math.max(availableHeight, MIN_HEIGHT);

            if (skipAnimation) {
              commentsHeight.value = nextHeight;
            } else {
              commentsHeight.value = withTiming(nextHeight, {
                duration: 150,
                easing: Easing.out(Easing.cubic),
              });
            }
          },
          100,
        ),
      [commentsHeight, insetBottom],
    );

    // Update height when dependencies change
    useEffect(() => {
      const skipAnimation = isInitialMount.current;
      updateCommentsHeight(
        bottomSheetPosition,
        keyboardHeight,
        Platform.OS === 'android' ? 0 : DEFAULT_COMPOSER_HEIGHT,
        skipAnimation,
      );

      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }, [bottomSheetPosition, keyboardHeight, updateCommentsHeight]);

    // Cleanup debounced function on unmount
    useEffect(() => {
      return () => {
        updateCommentsHeight.cancel();
      };
    }, [updateCommentsHeight]);

    const animatedCommentsStyle = useAnimatedStyle(() => {
      return {
        height: commentsHeight.value,
      };
    });

    const animatedFooterStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateY: animatedFooterTransform.value - insetBottom },
        ],
      };
    });

    const onSnapPointChange = useCallback((_: number, position: number) => {
      setBottomSheetPosition(position);
    }, []);

    const handleComposerMentionsPanelVisibleChange = useCallback(
      (isVisible: boolean) => {
        setMentionsPanelVisible(isVisible);
      },
      [],
    );

    const Header = useMemo(() => {
      return (
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX4,
            t.pB3,
            t.borderDefault,
            t.borderBHairline,
          ]}
        >
          <Pressable
            onPress={() => bottomSheetRef.current?.dismiss()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text2 color="primary" size="base" weight="medium">
              Cancel
            </Text2>
          </Pressable>
          <Text2 size="lg" weight="semibold">
            Comments
          </Text2>
          <View style={{ width: 50 }} />
        </View>
      );
    }, [t]);

    // Create a stable footer component with animated content
    const Footer = useCallback(
      ({ animatedFooterPosition }: BottomSheetFooterProps) => {
        return (
          <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
            <Animated.View
              style={[
                t.bgDefault,
                {
                  paddingBottom: insetBottom,
                },
                Platform.OS === 'android' ? animatedFooterStyle : {},
              ]}
            >
              <VideoCommentComposer
                cast={cast}
                onSuccess={handleComposerSuccess}
                onError={handleComposerError}
                onMentionsPanelVisibleChange={
                  handleComposerMentionsPanelVisibleChange
                }
              />
            </Animated.View>
          </BottomSheetFooter>
        );
      },
      [
        cast,
        insetBottom,
        t,
        handleComposerSuccess,
        handleComposerError,
        handleComposerMentionsPanelVisibleChange,
        animatedFooterStyle,
      ],
    );

    const handleOnEndReached = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
      <AutoDisplayingBottomSheetModal
        ref={bottomSheetRef}
        name="VideoComments"
        enableDynamicSizing={true}
        onDismiss={handleDismiss}
        snapPoints={['40%', '80%', '100%']}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 0,
        }}
        onChange={onSnapPointChange}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        footerComponent={Footer}
      >
        <View style={[t.relative, t.wFull, { minHeight: screenHeight * 0.5 }]}>
          {Header}
          <Animated.View style={[t.wFull, animatedCommentsStyle]}>
            <List
              data={comments}
              renderItem={renderItem}
              initialNumToRender={5}
              showsVerticalScrollIndicator={true}
              keyExtractor={keyExtractor}
              onEndReached={handleOnEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
              scrollEventThrottle={16}
              ListEmptyComponent={ListEmptyComponent}
              ListFooterComponent={ListFooterComponent}
              scrollEnabled={!mentionsPanelVisible}
            />
          </Animated.View>
        </View>
      </AutoDisplayingBottomSheetModal>
    );
  },
);

VideoCommentsSheet.displayName = 'VideoCommentsSheet';

export { VideoCommentsSheet };
