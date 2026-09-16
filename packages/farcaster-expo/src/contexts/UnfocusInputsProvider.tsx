import pull from 'lodash/pull';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { Keyboard } from 'react-native';

import { useSharedTelemetry } from '../contexts/SharedTelemetryContext';

type Callback = () => void;

type UnfocusInputContextValue = {
  addListener: (callback: Callback) => void;
  removeListener: (callback: Callback) => void;
  unfocusInputs: () => void;
};

const UnfocusInputContext = createContext<UnfocusInputContextValue>({
  addListener: () => undefined,
  removeListener: () => undefined,
  unfocusInputs: () => undefined,
});

type UnfocusInputsProviderProps = {
  children: ReactNode;
};

const UnfocusInputsProvider: FC<UnfocusInputsProviderProps> = memo(
  ({ children }) => {
    const { startRumAction, stopRumAction } = useSharedTelemetry();

    startRumAction('load_provider', { name: 'UnfocusInputsProvider' });

    const listeners = useRef<Callback[]>([]).current;

    const addListener = useCallback(
      (callback: Callback) => {
        listeners.push(callback);
      },
      [listeners],
    );

    const removeListener = useCallback(
      (callback: Callback) => {
        pull(listeners, callback);
      },
      [listeners],
    );

    const unfocusInputs = useCallback(() => {
      Keyboard.dismiss();
      listeners.forEach((listener) => listener());
    }, [listeners]);

    const value = React.useMemo(
      () => ({ addListener, removeListener, unfocusInputs }),
      [addListener, removeListener, unfocusInputs],
    );

    stopRumAction('load_provider', { name: 'UnfocusInputsProvider' });

    return (
      <UnfocusInputContext.Provider value={value}>
        {children}
      </UnfocusInputContext.Provider>
    );
  },
);

const useUnfocusInputs = () => useContext(UnfocusInputContext);

UnfocusInputsProvider.displayName = 'UnfocusInputsProvider';

export { UnfocusInputsProvider, useUnfocusInputs };
