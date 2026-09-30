import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import EventEmitter from 'eventemitter3';
import React from 'react';
import {
  AppState,
  AppStateStatus,
  NativeScrollEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  cancelAnimation,
  interpolate,
  runOnJS,
  ScrollHandlers,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { topBarHeight } from '~/components/CollapsibleTab/FeedTopBar';
import { clearActiveSnapLift } from '~/components/Snap/snapLiftState';

type ShellContextType = {
  headerMode: SharedValue<number>;
};
type ShellSetContextType = (v: boolean) => void;

const ShellContext = React.createContext<ShellContextType>({} as never);
const ShellSetContext = React.createContext<ShellSetContextType>({} as never);

type ShellProviderProps = {
  children: React.ReactNode;
};

export function ShellContextProvider({ children }: ShellProviderProps) {
  const headerMode = useSharedValue(0);
  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet';
      cancelAnimation(headerMode);
      headerMode.value = withSpring(v ? 1 : 0, {
        overshootClamping: true,
      });
    },
    [headerMode],
  );

  // On Android, reset header to visible when returning from background.
  // The animated headerMode shared value can get stuck at an intermediate
  // value if the app went to background mid-scroll-animation, leaving the
  // header with pointerEvents: 'none' and making it unresponsive.
  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          previousState.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          cancelAnimation(headerMode);
          headerMode.value = withSpring(0, { overshootClamping: true });
        }
        previousState = nextState;
      },
    );
    return () => subscription.remove();
  }, [headerMode]);

  const value = React.useMemo(
    () => ({
      headerMode,
    }),
    [headerMode],
  );
  return (
    <ShellContext.Provider value={value}>
      <ShellSetContext.Provider value={setMode}>
        {children}
      </ShellSetContext.Provider>
    </ShellContext.Provider>
  );
}

export function useMinimalShellMode() {
  return React.useContext(ShellContext);
}

export function useSetMinimalShellMode() {
  return React.useContext(ShellSetContext);
}

type ShellLayoutContextType = {
  headerHeight: SharedValue<number>;
};

const ShellLayoutContext = React.createContext<ShellLayoutContextType>(
  {} as never,
);

export function ShellLayoutContextProvider({
  children,
}: React.PropsWithChildren) {
  const headerHeight = useSharedValue(0);

  const value = React.useMemo(
    () => ({
      headerHeight,
    }),
    [headerHeight],
  );

  return (
    <ShellLayoutContext.Provider value={value}>
      {children}
    </ShellLayoutContext.Provider>
  );
}

export function useShellLayout() {
  return React.useContext(ShellLayoutContext);
}

type HomeFeedRequiredScrollHandlers = Record<string, unknown>;

const ScrollContext = React.createContext<
  ScrollHandlers<HomeFeedRequiredScrollHandlers>
>({
  onBeginDrag: undefined,
  onEndDrag: undefined,
  onScroll: undefined,
  onMomentumEnd: undefined,
});

export function useScrollHandlers(): ScrollHandlers<HomeFeedRequiredScrollHandlers> {
  return React.useContext(ScrollContext);
}

type ProviderProps = {
  children: React.ReactNode;
} & ScrollHandlers<HomeFeedRequiredScrollHandlers>;

// Note: this completely *overrides* the parent handlers.
// It's up to you to compose them with the parent ones via useScrollHandlers() if needed.
export function ScrollProvider({
  children,
  onBeginDrag,
  onEndDrag,
  onScroll,
  onMomentumEnd,
}: ProviderProps) {
  const handlers = React.useMemo(
    () => ({
      onBeginDrag,
      onEndDrag,
      onScroll,
      onMomentumEnd,
    }),
    [onBeginDrag, onEndDrag, onScroll, onMomentumEnd],
  );
  return (
    <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>
  );
}

function clamp(num: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(num, min), max);
}

export function MainScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { headerHeight } = useShellLayout();
  const { headerMode } = useMinimalShellMode();
  const startDragOffset = useSharedValue<number | null>(null);
  const startMode = useSharedValue<number | null>(null);

  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet';
      cancelAnimation(headerMode);
      headerMode.value = withSpring(v ? 1 : 0, {
        overshootClamping: true,
      });
    },
    [headerMode],
  );

  const snapToClosestState = React.useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      if (startDragOffset.value === null) {
        return;
      }
      const didScrollDown = e.contentOffset.y > startDragOffset.value;
      startDragOffset.value = null;
      startMode.value = null;
      if (e.contentOffset.y < headerHeight.value) {
        // If we're close to the top, show the shell.
        setMode(false);
      } else if (didScrollDown) {
        // Showing the bar again on scroll down feels annoying, so don't.
        setMode(true);
      } else {
        // Snap to whichever state is the closest.
        setMode(Math.round(headerMode.value) === 1);
      }
    },
    [startDragOffset, startMode, setMode, headerMode, headerHeight],
  );

  const onBeginDrag = React.useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      runOnJS(clearActiveSnapLift)();
      startDragOffset.value = e.contentOffset.y;
      startMode.value = headerMode.value;
    },
    [headerMode, startDragOffset, startMode],
  );

  const onEndDrag = React.useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      if (e.velocity && e.velocity.y !== 0) {
        // If we detect a velocity, wait for onMomentumEnd to snap.
        return;
      }
      // Zero-velocity drag (slow release) — snap immediately since
      // onMomentumEnd will never fire, which left the header at an
      // intermediate value with pointerEvents:'none' blocking input.
      snapToClosestState(e);
    },
    [snapToClosestState],
  );

  const onMomentumEnd = React.useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      snapToClosestState(e);
    },
    [snapToClosestState],
  );

  const onScroll = React.useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      if (startDragOffset.value === null || startMode.value === null) {
        if (headerMode.value !== 0 && e.contentOffset.y < headerHeight.value) {
          // If we're close enough to the top, always show the shell.
          // Even if we're not dragging.
          setMode(false);
        }
        return;
      }

      // The "mode" value is always between 0 and 1.
      // Figure out how much to move it based on the current dragged distance.
      const dy = e.contentOffset.y - startDragOffset.value;
      if (dy !== 0) {
        runOnJS(clearActiveSnapLift)();
      }
      const dProgress = interpolate(
        dy,
        [-headerHeight.value, headerHeight.value],
        [-1, 1],
      );
      const newValue = clamp(startMode.value + dProgress, 0, 1);
      if (newValue !== headerMode.value) {
        // Manually adjust the value. This won't be (and shouldn't be) animated.
        // Cancel any any existing animation
        cancelAnimation(headerMode);
        headerMode.value = newValue;
      }
    },
    [headerHeight, headerMode, setMode, startDragOffset, startMode],
  );

  return (
    <ScrollProvider
      onBeginDrag={onBeginDrag}
      onEndDrag={onEndDrag}
      onScroll={onScroll}
      onMomentumEnd={onMomentumEnd}
    >
      {children}
    </ScrollProvider>
  );
}

export function OnlyDragScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScrollProvider>{children}</ScrollProvider>;
}

export function useMinimalShellHeaderTransform() {
  const { headerMode } = useMinimalShellMode();
  const { headerHeight } = useShellLayout();

  const headerTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: headerMode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerMode.value, 2),
      transform: [
        {
          translateY: interpolate(
            headerMode.value,
            [0, 1],
            [0, -headerHeight.value],
          ),
        },
      ],
    };
  });

  return headerTransform;
}

export function useMinimalShellHeaderToastTransform() {
  const { headerMode } = useMinimalShellMode();
  const { headerHeight } = useShellLayout();

  const headerTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            headerMode.value,
            [0, 1],
            [0, -headerHeight.value],
          ),
        },
      ],
    };
  });

  return headerTransform;
}

export function useHeaderOffset() {
  const { fontScale } = useWindowDimensions();

  const navBarHeight = topBarHeight;

  const tabBarPad = 26;
  const normalLineHeight = 20;
  const tabBarText = normalLineHeight * fontScale;
  return navBarHeight + tabBarPad + tabBarText;
}

type UnlistenFn = () => void;

const emitter = new EventEmitter();

export function emitResetFeedShellState() {
  emitter.emit('reset-feed-shell-state');
}
export function listenResetFeedShellState(fn: () => void): UnlistenFn {
  emitter.on('reset-feed-shell-state', fn);
  return () => emitter.off('reset-feed-shell-state', fn);
}

const MIN_POST_HEIGHT = 100;

export function useInitialNumToRender({
  minItemHeight = MIN_POST_HEIGHT,
  screenHeightOffset = 0,
}: { minItemHeight?: number; screenHeightOffset?: number } = {}) {
  const { height: screenHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const finalHeight =
    screenHeight - screenHeightOffset - topInset - bottomTabBarHeight;

  const minItems = Math.floor(finalHeight / minItemHeight);
  if (minItems < 1) {
    return 1;
  }
  return minItems;
}

type HomeScreenSelectedFeedContextType = {
  feedKey: string;
  setFeedKey: ({ feedKey }: { feedKey: string }) => void;
};

let lastSelectedHomeFeedKey = 'home';

const HomeScreenSelectedFeedContext =
  React.createContext<HomeScreenSelectedFeedContextType>({} as never);

export function HomeScreenSelectedFeedContextProvider({
  children,
}: React.PropsWithChildren) {
  const [feedKey, setFeedKey] = React.useState<string>('home');

  React.useEffect(() => {
    lastSelectedHomeFeedKey = feedKey;
  }, [feedKey]);

  const setFeedKeyForContext = React.useCallback(
    ({ feedKey: feedKeyToSet }: { feedKey: string }) => {
      if (feedKey !== feedKeyToSet) {
        setFeedKey(feedKeyToSet);
      }
    },
    [feedKey],
  );

  const value = React.useMemo(
    () => ({
      feedKey,
      setFeedKey: setFeedKeyForContext,
    }),
    [feedKey, setFeedKeyForContext],
  );

  return (
    <HomeScreenSelectedFeedContext.Provider value={value}>
      {children}
    </HomeScreenSelectedFeedContext.Provider>
  );
}

export function useHomeScreenSelectedFeed() {
  return React.useContext(HomeScreenSelectedFeedContext);
}

export function getLastSelectedHomeFeedKey() {
  return lastSelectedHomeFeedKey;
}

type HomeSearchContextType = {
  searchAutoOpen: boolean;
  setSearchAutoOpen: (v: boolean) => void;
};

const HomeSearchContext = React.createContext<HomeSearchContextType>(
  {} as never,
);

export function HomeSearchProvider({ children }: React.PropsWithChildren) {
  const [searchAutoOpen, setSearchAutoOpen] = React.useState(false);
  const value = React.useMemo(
    () => ({ searchAutoOpen, setSearchAutoOpen }),
    [searchAutoOpen],
  );
  return (
    <HomeSearchContext.Provider value={value}>
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch() {
  return React.useContext(HomeSearchContext);
}
