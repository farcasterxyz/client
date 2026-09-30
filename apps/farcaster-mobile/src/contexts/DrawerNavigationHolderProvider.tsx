import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

type DrawerNavigation = {
  setOptions: (options: Record<string, unknown>) => void;
};

const noop = () => {};

type DrawerNavigationHolderContext = {
  setNavigation: (navigation: DrawerNavigation) => void;
  navigation: DrawerNavigation;
};

const DrawerNavigationHolderContext =
  createContext<DrawerNavigationHolderContext>({} as never);

type DrawerNavigationHolderProviderProps = {
  children: ReactNode;
};

const DrawerNavigationHolderProvider: FC<DrawerNavigationHolderProviderProps> =
  memo(({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'DrawerNavigationHolderProvider',
    });

    const [navigation, setNavigation] = useState<DrawerNavigation>({
      setOptions: noop,
    });

    const value = useMemo(() => ({ setNavigation, navigation }), [navigation]);

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'DrawerNavigationHolderProvider',
    });

    return (
      <DrawerNavigationHolderContext.Provider value={value}>
        {children}
      </DrawerNavigationHolderContext.Provider>
    );
  });

DrawerNavigationHolderProvider.displayName = 'DrawerNavigationHolderProvider';

const useDrawerNavigation = () => useContext(DrawerNavigationHolderContext);

export { DrawerNavigationHolderProvider, useDrawerNavigation };
