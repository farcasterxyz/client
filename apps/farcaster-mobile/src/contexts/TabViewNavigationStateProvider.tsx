import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { trackError } from '~/utils/ErrorUtils';

export type TabViewNavigationState = { [route: string]: string };

interface TabViewNavigationStateContextValue {
  getState: () => TabViewNavigationState;
  getCurrentTabName: (route: string) => string | undefined;
  setCurrentTabName: (route: string, tabName: string) => void;
}

const TabViewNavigationStateContext =
  createContext<TabViewNavigationStateContextValue>({
    getState: () => ({}),
    getCurrentTabName: () => {
      trackError(
        'TabViewNavigationStateContext.getCurrentTabName() called before its initialized properly.',
      );
      return undefined;
    },
    setCurrentTabName: () => {
      trackError(
        'TabViewNavigationStateContext.setCurrentTabName() called before its initialized properly.',
      );
    },
  });

type TabViewNavigationStateProviderProps = {
  children: ReactNode;
};

const TabViewNavigationStateProvider: FC<TabViewNavigationStateProviderProps> =
  memo(({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'TabViewNavigationStateProvider',
    });

    const [ctn, setCtn] = useState<TabViewNavigationState>({});

    const getState = useCallback(() => {
      return ctn;
    }, [ctn]);

    const getCurrentTabName = useCallback(
      (route: string) => {
        return ctn[route] || undefined;
      },
      [ctn],
    );

    const setCurrentTabName = useCallback((route: string, tabName: string) => {
      setCtn((prev) => {
        prev[route] = tabName;
        return { ...prev };
      });
    }, []);

    const value = useMemo(
      () => ({ getState, getCurrentTabName, setCurrentTabName }),
      [getState, getCurrentTabName, setCurrentTabName],
    );

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'TabViewNavigationStateProvider',
    });

    return (
      <TabViewNavigationStateContext.Provider value={value}>
        {children}
      </TabViewNavigationStateContext.Provider>
    );
  });

const useTabViewNavigationState = () =>
  useContext(TabViewNavigationStateContext);

TabViewNavigationStateProvider.displayName = 'TabViewNavigationStateProvider';

export { TabViewNavigationStateProvider, useTabViewNavigationState };
