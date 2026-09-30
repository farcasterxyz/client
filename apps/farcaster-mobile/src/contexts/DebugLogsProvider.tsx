import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

type DebugLog = {
  text: string;
  timestamp: number;
};

type DebugLogsContext = {
  getLogs: () => DebugLog[];
  addLog: (log: string) => void;
  clearLogs: () => void;
};

const DebugLogsContext = createContext<DebugLogsContext>({
  getLogs: () => [],
  addLog: () => undefined,
  clearLogs: () => undefined,
});

type DebugLogsProviderProps = { children: ReactNode };

const maxNumLogs = 150;

const DebugLogsProvider: FC<DebugLogsProviderProps> = ({ children }) => {
  const logsRef = useRef<DebugLog[]>([]);

  const getLogs = useCallback(() => [...logsRef.current], []);

  const addLog = useCallback((log: string) => {
    logsRef.current.push({ timestamp: Date.now(), text: log });
    while (logsRef.current.length > maxNumLogs) {
      logsRef.current.shift();
    }
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
  }, []);

  return (
    <DebugLogsContext.Provider value={{ getLogs, addLog, clearLogs }}>
      {children}
    </DebugLogsContext.Provider>
  );
};

const useDebugLogs = () => useContext(DebugLogsContext);

export { type DebugLog, DebugLogsProvider, useDebugLogs };
