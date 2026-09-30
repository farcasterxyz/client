import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

const maxNumEntries = 100;

type CryptographyLog = {
  message: string;
  timestamp: number;
  id: number;
};

type DebugCryptographyContextValue = {
  addCryptographyLog: (message: string) => void;
  getCryptographyLogs: () => CryptographyLog[];
};

const DebugCryptographyContext = createContext<DebugCryptographyContextValue>({
  addCryptographyLog: () => undefined,
  getCryptographyLogs: () => [],
});

type DebugCryptographyProviderProps = {
  children: ReactNode;
};

const DebugCryptographyProvider: FC<DebugCryptographyProviderProps> = memo(
  ({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'DebugCryptographyProvider',
    });

    const logs = useRef<CryptographyLog[]>([]).current;
    const nextLogId = useRef(0);

    const addCryptographyLog = useCallback(
      (message: string) => {
        logs.unshift({
          message,
          timestamp: Date.now(),
          id: nextLogId.current++,
        });

        if (logs.length > maxNumEntries) {
          logs.length = maxNumEntries;
        }
      },
      [logs],
    );

    const getCryptographyLogs = useCallback(() => logs, [logs]);

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'DebugCryptographyProvider',
    });

    return (
      <DebugCryptographyContext.Provider
        value={{ addCryptographyLog, getCryptographyLogs }}
      >
        {children}
      </DebugCryptographyContext.Provider>
    );
  },
);

DebugCryptographyProvider.displayName = 'DebugCryptographyProvider';

const useDebugCryptography = () => useContext(DebugCryptographyContext);

export { DebugCryptographyProvider, useDebugCryptography };
