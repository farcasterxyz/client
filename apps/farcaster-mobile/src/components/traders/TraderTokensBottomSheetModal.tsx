import { ApiTokenLink, ApiUser } from 'farcaster-client-data';
import {
  AutoDisplayingBottomSheetModal,
  TraderBottomSheetHeader,
  TraderTokenBottomSheetContent,
  useTheme,
} from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TraderTokens } from '~/components/traders/TraderTokens';
import { usePush } from '~/hooks/navigation/usePush';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export function TraderTokensBottomSheetModal({
  user,
  onDismiss,
}: {
  user: ApiUser;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const push = usePush();

  const [viewToken, setViewToken] = useState<ApiTokenLink | null>(null);

  // 0 = list view, 1 = detail view
  const progress = useSharedValue(0);

  // Tracks swipe gesture offset
  const swipeOffset = useSharedValue(0);

  const navigateToViewToken = useCallback(
    (token: ApiTokenLink) => {
      setViewToken(token);
      progress.value = withTiming(1, { duration: 300 });
    },
    [progress],
  );

  const navigateToListView = useCallback(() => {
    'worklet';
    swipeOffset.value = withTiming(0, { duration: 250 });
    progress.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setViewToken)(null);
      }
    });
  }, [progress, swipeOffset]);

  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(10)
        .failOffsetY([-15, 15])
        .onUpdate((e) => {
          'worklet';
          if (e.translationX > 0) {
            swipeOffset.value = e.translationX;
          }
        })
        .onEnd((e) => {
          'worklet';
          if (
            e.translationX > SWIPE_THRESHOLD ||
            e.velocityX > VELOCITY_THRESHOLD
          ) {
            navigateToListView();
          } else {
            swipeOffset.value = withSpring(0, { damping: 20 });
          }
        }),
    [swipeOffset, navigateToListView],
  );

  // List view slides slightly left when token is shown
  const listAnimatedStyle = useAnimatedStyle(() => {
    const baseTranslate = interpolate(
      progress.value,
      [0, 1],
      [0, -SCREEN_WIDTH * 0.3],
    );
    const swipeAdjust = interpolate(
      swipeOffset.value,
      [0, SCREEN_WIDTH],
      [0, SCREEN_WIDTH * 0.3],
    );
    return {
      transform: [{ translateX: baseTranslate + swipeAdjust }],
      opacity: interpolate(progress.value, [0, 1], [1, 0.5]),
    };
  });

  // View token view slides in from right
  const viewTokenAnimatedStyle = useAnimatedStyle(() => {
    const baseTranslate = interpolate(
      progress.value,
      [0, 1],
      [SCREEN_WIDTH, 0],
    );
    return {
      transform: [{ translateX: baseTranslate + swipeOffset.value }],
    };
  });

  const onUserPress = useCallback(() => {
    if (viewToken) {
      runOnJS(navigateToListView)();
    } else {
      push('UserV2', { fid: user.fid });
    }
  }, [push, user.fid, viewToken, navigateToListView]);

  const onTokenPress = useCallback(
    (token: ApiTokenLink) =>
      push('Token', {
        chain: token.chain,
        ca: token.ca,
        via: 'token-user-positions',
      }),
    [push],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="user-wallet-token-balances"
      handleIndicatorStyle={{ backgroundColor: t.colors.text.tertiary }}
      snapPoints={['100%']}
      enableDynamicSizing={false}
      disableBottomSheetContentContainer
      onDismiss={onDismiss}
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      <TraderBottomSheetHeader
        user={user}
        token={viewToken ?? undefined}
        onUserPress={onUserPress}
        onTokenPress={() => viewToken && onTokenPress(viewToken)}
      />

      {/* Stacked views container */}
      <View style={[t.flex1, { overflow: 'hidden' }]}>
        {/* List view - always mounted */}
        <Animated.View style={[StyleSheet.absoluteFill, listAnimatedStyle]}>
          <TraderTokens
            user={user}
            componentType="bottomsheet"
            onTokenPress={navigateToViewToken}
          />
        </Animated.View>

        {/* Detail view - mounted when token is selected */}
        {viewToken && (
          <GestureDetector gesture={swipeBackGesture}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                viewTokenAnimatedStyle,
                t.bgDefault,
              ]}
            >
              <TraderTokenBottomSheetContent user={user} token={viewToken} />
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
