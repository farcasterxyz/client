import React, { FC, PropsWithChildren } from 'react';
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  StyleProp,
  TextStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  computeCopyBubbleLeft,
  computeCopyBubbleTop,
  COPY_BUBBLE_HEIGHT,
  COPY_BUBBLE_WIDTH,
} from '~/components/copyBubblePosition';
import { Text } from '~/components/Text';
import {
  NestedTextLongPressContext,
  TextWithPress,
} from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';

type LongPressCopyTextProps = PropsWithChildren<{
  style: StyleProp<TextStyle>;
  onCopy: () => void | Promise<void>;
  accessibilityLabel?: string;
}>;

// Mounted only while the bubble is showing so the window-dimension and
// safe-area subscriptions don't re-render the enclosing text while idle.
const CopyBubble: FC<{
  pressX: number;
  pressY: number;
  accessibilityLabel: string;
  onCopyPress: (event: GestureResponderEvent) => void;
  onDismiss: () => void;
}> = ({ pressX, pressY, accessibilityLabel, onCopyPress, onDismiss }) => {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const bubbleLeft = computeCopyBubbleLeft({ pressX, windowWidth });
  const bubbleTop = computeCopyBubbleTop({ pressY, topInset: insets.top });

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={[t.flex1]} onPress={onDismiss}>
        <Pressable
          onPress={onCopyPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={[
            t.absolute,
            t.itemsCenter,
            t.justifyCenter,
            t.bgElevated,
            t.roundedFull,
            t.shadowLg,
            {
              left: bubbleLeft,
              top: bubbleTop,
              width: COPY_BUBBLE_WIDTH,
              height: COPY_BUBBLE_HEIGHT,
            },
          ]}
        >
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
            Copy
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// On RN 0.83 + New Architecture, `selectable` is a no-op on Android
// entirely (verified on emulator: neither static true, the legacy
// onLayout/onPress flip for react-navigation#5476, nor a delayed
// setTimeout flip engages selection), so Android surfaces render this
// iOS-callout-style "Copy" bubble at the long-press point instead.
// The caller owns the copy action (clipboard write + confirmation UI).
const LongPressCopyText: FC<LongPressCopyTextProps> = React.memo(
  ({ children, style, onCopy, accessibilityLabel = 'Copy text' }) => {
    const [bubbleAt, setBubbleAt] = React.useState<{
      x: number;
      y: number;
    } | null>(null);

    const onLongPress = React.useCallback((event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      setBubbleAt({ x: pageX, y: pageY });
    }, []);

    const dismiss = React.useCallback(() => setBubbleAt(null), []);

    const onCopyPress = React.useCallback(
      async (event: GestureResponderEvent) => {
        // The bubble sits inside the full-screen backdrop Pressable; stop
        // propagation so the backdrop never also receives this press.
        event.stopPropagation();
        setBubbleAt(null);

        await onCopy();
      },
      [onCopy],
    );

    return (
      <>
        {/* The provider lets nested pressable spans (mentions/links) forward
            long-presses that their own responder would otherwise swallow. */}
        <NestedTextLongPressContext.Provider value={onLongPress}>
          <TextWithPress style={style} onLongPress={onLongPress}>
            {children}
          </TextWithPress>
        </NestedTextLongPressContext.Provider>
        {bubbleAt !== null && (
          <CopyBubble
            pressX={bubbleAt.x}
            pressY={bubbleAt.y}
            accessibilityLabel={accessibilityLabel}
            onCopyPress={onCopyPress}
            onDismiss={dismiss}
          />
        )}
      </>
    );
  },
);

LongPressCopyText.displayName = 'LongPressCopyText';

export { LongPressCopyText };
