import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import { useDrawerNavigation } from './DrawerNavigationHolderProvider';

// Changing this back to the default from the docs
export const SWIPE_EDGE_WIDTH = 32; // https://github.com/react-navigation/react-navigation/blob/ba868fcc87035958dd3250e81691f1f3098be033/packages/drawer/src/views/DrawerView.tsx#L104

const noop = () => {};

type DrawerContext = {
  setSwipeEnabled: (enabled: boolean) => void;
  swipeEnabled: boolean;
};

const DrawerContext = createContext<DrawerContext>({
  setSwipeEnabled: noop,
  swipeEnabled: true,
});

type DrawerProviderProps = {
  children: ReactNode;
};

const DrawerProvider: FC<DrawerProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DrawerProvider',
  });

  const { navigation } = useDrawerNavigation();

  const [swipeEnabled, _setSwipeEnabled] = useState(true);

  const setSwipeEnabled = useCallback((enabled: boolean) => {
    _setSwipeEnabled(enabled);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ swipeEnabled });
  }, [navigation, swipeEnabled]);

  const value = useMemo(
    () => ({ setSwipeEnabled, swipeEnabled }),
    [setSwipeEnabled, swipeEnabled],
  );

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DrawerProvider',
  });

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
});

DrawerProvider.displayName = 'DrawerProvider';

const useDrawer = () => useContext(DrawerContext);

export { DrawerProvider, useDrawer };
