import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { RequestInfo } from 'farcaster-client-data';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

export type TimeoutInfo = {
  requestInfo: RequestInfo;
  timeSinceRequestStart: number;
  timedOutAt: number;
};

export type StoredTimeoutInfo = TimeoutInfo & {
  id: number;
};

type TimeoutHistoryContextValue = {
  addTimeout: (timeout: TimeoutInfo) => void;
  timeouts: StoredTimeoutInfo[];
};

const TimeoutHistoryContext = createContext<TimeoutHistoryContextValue>({
  addTimeout: () => undefined,
  timeouts: [],
});

type TimeoutHistoryProviderProps = {
  children: ReactNode;
};

const TimeoutHistoryProvider: FC<TimeoutHistoryProviderProps> = memo(
  ({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'TimeoutHistoryProvider',
    });

    const [timeouts, setTimeouts] = useState<StoredTimeoutInfo[]>([]);
    const nextTimeoutId = useRef(0);

    const addTimeout = useCallback(
      (timeout: TimeoutInfo) =>
        setTimeouts((prevTimeouts) => [
          ...prevTimeouts,
          { ...timeout, id: nextTimeoutId.current++ },
        ]),
      [],
    );

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'TimeoutHistoryProvider',
    });

    return (
      <TimeoutHistoryContext.Provider value={{ addTimeout, timeouts }}>
        {children}
      </TimeoutHistoryContext.Provider>
    );
  },
);

const useTimeoutHistory = () => useContext(TimeoutHistoryContext);

export { TimeoutHistoryProvider, useTimeoutHistory };
