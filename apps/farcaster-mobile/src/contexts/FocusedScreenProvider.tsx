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

import { FocusedScreen, ScreenName } from '~/types';

type FocusedScreenContextValue = {
  focusedScreen: FocusedScreen<ScreenName> | undefined;
  setFocusedScreen: <Name extends ScreenName>(
    focusedScreen: FocusedScreen<Name>,
  ) => void;
};

const FocusedScreenContext = createContext<FocusedScreenContextValue>({
  focusedScreen: undefined,
  setFocusedScreen: () => undefined,
});

type FocusedScreenProviderProps = {
  children: ReactNode;
};

const FocusedScreenProvider: FC<FocusedScreenProviderProps> = memo(
  ({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'FocusedScreenProvider',
    });

    const [focusedScreen, setFocusedScreen] =
      useState<FocusedScreen<ScreenName>>();

    const value = useMemo(
      () => ({ focusedScreen, setFocusedScreen }),
      [focusedScreen, setFocusedScreen],
    );

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'FocusedScreenProvider',
    });

    return (
      <FocusedScreenContext.Provider value={value}>
        {children}
      </FocusedScreenContext.Provider>
    );
  },
);

FocusedScreenProvider.displayName = 'FocusedScreenProvider';

const useFocusedScreen = () => useContext(FocusedScreenContext);

export { FocusedScreenProvider, useFocusedScreen };
