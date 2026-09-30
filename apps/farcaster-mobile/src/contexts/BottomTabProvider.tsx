import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import noop from 'lodash/noop';
import React, {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { BottomTabName } from '~/types';

// Preserving for context, but the following may no longer be relevant:

// Originally we added a hook to Screen that utilized the
// `useBottomTabBarHeight` hook to get the component height
// from React Navigation. Unfortunately, this throws an error
// when called from a modal – which is a peer of the `BottomTabNavigator`,
// not a child. We also looked into passing a custom `tabBar`
// as an option to the bottom tab navigator, but unfortunately
// we can't simply wrap a view that uses `onLayout` to measure
// the height around `BottomTabBar` (https://github.com/react-navigation/react-navigation/blob/3fb21409d6d0b66266c6d5eded2014ef2ebbda0a/packages/bottom-tabs/src/views/BottomTabBar.tsx)
// and the logic in that component is more complex than we'd like
// to copy. The dumb thing is the right thing, for now at least.
const defaultBottomTabBarHeight = Platform.select({
  android: 80.6,
  default: 79,
});

type BottomTabContext = {
  bottomTabBarHeight: number;
  setBottomTabBarHeight: (height: number) => void;
  focusedBottomTabRef: React.MutableRefObject<BottomTabName>;
  setFocusedBottomTab: (tab: BottomTabName) => void;
};

const BottomTabContext = createContext<BottomTabContext>({
  bottomTabBarHeight: defaultBottomTabBarHeight,
  setBottomTabBarHeight: noop,
  focusedBottomTabRef: { current: '' as never },
  setFocusedBottomTab: () => undefined,
});

type BottomTabProviderProps = {
  children: ReactNode;
};

const BottomTabProvider = memo(({ children }: BottomTabProviderProps) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'BottomTabProvider',
  });

  const [bottomTabBarHeight, _setBottomTabBarHeight] = useState(
    defaultBottomTabBarHeight,
  );

  const setBottomTabBarHeight = useCallback((height: number) => {
    _setBottomTabBarHeight((prev) => {
      if (Math.abs(prev - height) < 0.5) {
        return prev;
      }

      return height;
    });
  }, []);

  // Using a ref to prevent component rerenders, as we only ever need
  // to read the current value of the focused tab in onPress handlers
  const focusedBottomTabRef = useRef<BottomTabName>('' as never);
  const setFocusedBottomTab = useCallback((tab: BottomTabName) => {
    focusedBottomTabRef.current = tab;
  }, []);

  const value = useMemo(
    () => ({
      bottomTabBarHeight,
      setBottomTabBarHeight,
      focusedBottomTabRef,
      setFocusedBottomTab,
    }),
    [bottomTabBarHeight, setBottomTabBarHeight, setFocusedBottomTab],
  );

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'BottomTabProvider',
  });

  return (
    <BottomTabContext.Provider value={value}>
      {children}
    </BottomTabContext.Provider>
  );
});

BottomTabProvider.displayName = 'BottomTabProvider';

const useBottomTab = () => useContext(BottomTabContext);

export { BottomTabProvider, useBottomTab };
