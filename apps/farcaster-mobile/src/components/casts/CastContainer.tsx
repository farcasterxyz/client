import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  CastClickType,
  getFeedSourceOn,
  ThreadPosition,
  useCastLinkHelpers,
  useTrackCastClick,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { memo, ReactNode, useCallback, useMemo } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Pressable as GHPressable } from 'react-native-gesture-handler';

import {
  consumeRecentSnapLiftDismissal,
  dismissActiveSnapLiftFromOutsideTouch,
} from '~/components/Snap/snapLiftState';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { AdminGatedFeedCastBackground } from './AdminGatedFeedCastBackground';

// Use RNGH Pressable on Android for better scroll gesture cooperation.
// The RN Pressable can capture touch events aggressively on Android,
// preventing parent ScrollViews/FlatLists from recognising scroll gestures
// when the Pressable is rendered as an absolute overlay (inset-0).
const ScrollFriendlyPressable =
  Platform.OS === 'android' ? GHPressable : Pressable;

type CastContainerProps = {
  children: ReactNode;
  hash: string;
  isFocusedCast: boolean;
  threadPosition: ThreadPosition | undefined;
  hideBottomBorder?: boolean;
  isAdminGatedFeedCast?: boolean;
  onStartShouldSetResponderCapture?: (event: GestureResponderEvent) => boolean;
};

export function TapOnCastGestureHandler({
  castOpenIncludeReason,
  hash,
  children,
}: React.PropsWithChildren<{
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  hash: string;
}>) {
  const t = useTheme();
  const push = usePush();
  const trackCastClick = useTrackCastClick();
  const {
    defaultEventProps: { on },
  } = useTrackEvent();

  const { shouldLinkToCast } = useCastLinkHelpers();

  const pressShouldPushToCastConversation = useMemo(() => {
    return shouldLinkToCast({ castHash: hash });
  }, [hash, shouldLinkToCast]);

  const onPress = useCallback(() => {
    if (consumeRecentSnapLiftDismissal()) {
      return;
    }

    if (pressShouldPushToCastConversation) {
      const sourceOn = getFeedSourceOn(on);

      trackCastClick({ type: CastClickType.Cast });

      push('Cast', {
        castHash: hash,
        ...(castOpenIncludeReason
          ? { castOpenIncludeReason: castOpenIncludeReason }
          : {}),
        ...(sourceOn ? { sourceOn } : {}),
      });
    }
  }, [
    castOpenIncludeReason,
    hash,
    on,
    pressShouldPushToCastConversation,
    push,
    trackCastClick,
  ]);

  const style = React.useMemo(
    () => [t.flexGrow, t.flexShrink],
    [t.flexGrow, t.flexShrink],
  );

  if (!pressShouldPushToCastConversation) {
    return children;
  }

  return (
    <Pressable onPress={onPress} style={style} testID="cast-row">
      {children}
    </Pressable>
  );
}

const CastContainer = memo(
  ({
    children,
    isFocusedCast,
    threadPosition,
    hideBottomBorder = false,
    isAdminGatedFeedCast = false,
    onStartShouldSetResponderCapture,
  }: CastContainerProps) => {
    const t = useTheme();

    const shouldShowBottomBorder = useMemo(
      () =>
        !hideBottomBorder &&
        (isFocusedCast ||
          threadPosition === undefined ||
          threadPosition === 'start_and_end' ||
          threadPosition === 'middle_with_show_more' ||
          threadPosition === 'end_with_show_more' ||
          threadPosition === 'end_continuous' ||
          threadPosition === 'end_disconnected'),
      [hideBottomBorder, isFocusedCast, threadPosition],
    );

    const style = useMemo(
      () => [
        t.relative,
        { borderColor: t.colors.feed.threadLine },
        shouldShowBottomBorder ? { borderBottomWidth: 0.66 } : null,
      ],
      [shouldShowBottomBorder, t.colors.feed.threadLine, t.relative],
    );

    const handleStartShouldSetResponderCapture = useCallback(
      (event: GestureResponderEvent) => {
        dismissActiveSnapLiftFromOutsideTouch({
          pageX: event.nativeEvent.pageX,
          pageY: event.nativeEvent.pageY,
        });
        return onStartShouldSetResponderCapture?.(event) ?? false;
      },
      [onStartShouldSetResponderCapture],
    );

    return (
      <View
        style={style}
        onStartShouldSetResponderCapture={handleStartShouldSetResponderCapture}
      >
        {isAdminGatedFeedCast && <AdminGatedFeedCastBackground />}
        {children}
      </View>
    );
  },
);

export function PressableTargetToNavigateToCast({
  castOpenIncludeReason,
  hash,
  style,
  testID,
}: {
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  hash: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const push = usePush();
  const trackCastClick = useTrackCastClick();
  const {
    defaultEventProps: { on },
  } = useTrackEvent();

  const { shouldLinkToCast } = useCastLinkHelpers();

  const pressShouldPushToCastConversation = useMemo(() => {
    return shouldLinkToCast({ castHash: hash });
  }, [hash, shouldLinkToCast]);

  const onPress = useCallback(() => {
    if (consumeRecentSnapLiftDismissal()) {
      return;
    }

    if (pressShouldPushToCastConversation) {
      const sourceOn = getFeedSourceOn(on);

      trackCastClick({ type: CastClickType.Cast });
      push('Cast', {
        castHash: hash,
        ...(castOpenIncludeReason
          ? { castOpenIncludeReason: castOpenIncludeReason }
          : {}),
        ...(sourceOn ? { sourceOn } : {}),
      });
    }
  }, [
    castOpenIncludeReason,
    hash,
    on,
    pressShouldPushToCastConversation,
    push,
    trackCastClick,
  ]);

  if (!pressShouldPushToCastConversation) {
    return;
  }

  return (
    <ScrollFriendlyPressable
      onPress={onPress}
      style={[t.absolute, t.inset0, style]}
      // NEYN-11640: testID is supplied by call sites (UnfocusedCast)
      // so only the avatar-column instance is tagged for Maestro. The
      // bottom-row instance shares the component but its bounds sit
      // close to the avatar's hitSlop region on short text-only casts,
      // letting the avatar Pressable win the touch dispatch on Android
      // and navigate to the user profile instead of the cast detail
      // (run 27383828244, open-close-cast).
      testID={testID}
    />
  );
}

CastContainer.displayName = 'CastContainer';

export { CastContainer };
