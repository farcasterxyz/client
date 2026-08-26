import React from 'react';
import { Platform } from 'react-native';

// Zero-inset prop bundle for iOS UIScrollView-backed lists.
//
// Background: on iOS 26 + Fabric + rn-screens@4.25, the React-level
// `contentInset={0}` prop is not sufficient on its own. The native
// UIScrollView retains non-zero `contentInset` across screen recycles even
// when React's shadow tree thinks it's already zero, and the system / RN
// itself re-injects insets long after mount in response to:
//   - image / embed decode finishing and the scroll content size changing
//   - video autoplay kicking layout
//   - viewability fan-out on first paint
//   - keyboard show / hide
//   - RefreshControl finishing a refresh out-of-sync with its `refreshing`
//     flag (leaves `contentInset.top` elevated by ~refresh-control height)
//
// The defenses in this file are layered:
//   1. `ZERO_SCROLL_INSET_PROPS` — spread on the JSX of every iOS list so
//      the React-level inset is zero and stays zero across re-renders.
//   2. Initial burst (`INITIAL_INSET_RESET_DELAYS_MS`) — imperatively
//      re-asserts zero inset right after mount, covering the race window
//      during which splash / nav / keyboard transitions can leak inset
//      state into a newly-mounted UIScrollView.
//   3. Steady-state interval (750 ms) — defends against the late-injection
//      events above, which can fire at any point in the screen's lifetime
//      (image decode 30 s in, user toggling the keyboard, etc.). 750 ms is
//      slow enough to be effectively free (a JSI `setNativeProps` is a
//      no-op when the inset is already zero) and fast enough that visible
//      jank from a late injection is corrected within a frame or two.
//
// Same pattern, with the same root-cause comment, lives in CastScreen.tsx
// (which predates this helper). Do not shorten the interval to a bounded
// burst — it will reintroduce the late-injection bug.
const ZERO_SCROLL_INSET = { top: 0, bottom: 0, left: 0, right: 0 };
const ZERO_SCROLL_INSET_PROPS = {
  contentInset: ZERO_SCROLL_INSET,
  scrollIndicatorInsets: ZERO_SCROLL_INSET,
  contentInsetAdjustmentBehavior: 'never' as const,
  automaticallyAdjustContentInsets: false,
  automaticallyAdjustsScrollIndicatorInsets: false,
};
// Geometric back-off covering the worst window for splash / nav / keyboard
// transitions to leak inset state into a freshly mounted UIScrollView.
const INITIAL_INSET_RESET_DELAYS_MS = [0, 50, 150, 350, 700, 1500];

type ScrollResponderRef = React.RefObject<unknown>;

const getResponderSetNativeProps = (ref: ScrollResponderRef) => {
  const node = ref.current as {
    getScrollResponder?: () => unknown;
    setNativeProps?: (props: object) => void;
  } | null;
  const responder = node?.getScrollResponder?.() ?? node;
  const setNativeProps = (
    responder as { setNativeProps?: (props: object) => void } | null
  )?.setNativeProps;

  if (!responder || typeof setNativeProps !== 'function') {
    return undefined;
  }

  return (props: object) => setNativeProps.call(responder, props);
};

const forceZeroScrollInsets = (ref: ScrollResponderRef) => {
  if (Platform.OS !== 'ios') {
    return;
  }

  const setNativeProps = getResponderSetNativeProps(ref);

  if (!setNativeProps) {
    return;
  }

  try {
    setNativeProps({
      ...ZERO_SCROLL_INSET_PROPS,
    });
  } catch {
    // The native view can disappear during navigation teardown.
  }
};

// See the file-level comment for why both an initial burst AND an
// indefinite 750 ms interval are required (and why the interval cannot be
// safely bounded). Callers should pass `enabled: isFocused` so the work
// stops as soon as the screen is off-screen.
const useForceZeroScrollInsets = ({
  ref,
  enabled,
}: {
  ref: ScrollResponderRef;
  enabled: boolean;
}) => {
  React.useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') {
      return;
    }

    const timeoutIds = INITIAL_INSET_RESET_DELAYS_MS.map((delay) =>
      setTimeout(() => forceZeroScrollInsets(ref), delay),
    );
    const interval = setInterval(() => forceZeroScrollInsets(ref), 750);

    return () => {
      timeoutIds.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [enabled, ref]);
};

export {
  forceZeroScrollInsets,
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
};
