import { useCallback, useMemo, useRef } from 'react';
import { GestureResponderEvent, Platform } from 'react-native';

const PRESS_MOVE_THRESHOLD = 8;

// Android drawer items opened via hamburger can swallow onPress because
// react-native-drawer-layout's gesture handler wins the responder chain.
// Keep onPress as the primary handler and fall back on press-out when it
// was swallowed, skipping the fallback if the touch moved (e.g. scrolling).
// See react-navigation#12329.
export function useDrawerTouchablePress(
  onAction: () => void,
  options?: { hasLongPress?: boolean },
) {
  const activatedRef = useRef(false);
  const actionFiredRef = useRef(false);
  const startPageXRef = useRef(0);
  const startPageYRef = useRef(0);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const fireAction = useCallback(() => {
    onActionRef.current();
  }, []);

  return useMemo(() => {
    if (Platform.OS !== 'android' || options?.hasLongPress) {
      return { onPress: fireAction };
    }

    return {
      onPressIn: (event: GestureResponderEvent) => {
        activatedRef.current = true;
        actionFiredRef.current = false;
        startPageXRef.current = event.nativeEvent.pageX;
        startPageYRef.current = event.nativeEvent.pageY;
      },
      onPress: () => {
        actionFiredRef.current = true;
        fireAction();
      },
      onPressOut: (event: GestureResponderEvent) => {
        const activated = activatedRef.current;
        activatedRef.current = false;

        if (!activated || actionFiredRef.current) {
          return;
        }

        const dx = Math.abs(event.nativeEvent.pageX - startPageXRef.current);
        const dy = Math.abs(event.nativeEvent.pageY - startPageYRef.current);
        if (dx > PRESS_MOVE_THRESHOLD || dy > PRESS_MOVE_THRESHOLD) {
          return;
        }

        fireAction();
      },
    };
  }, [fireAction, options?.hasLongPress]);
}
