import { QueryKey } from '@tanstack/react-query';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

type PurgedContextValue = {
  checkIfRecentlyPurged: (params: {
    queryKey: QueryKey;
    threshold?: number;
  }) => boolean;
  markAsPurged: (params: { queryKey: QueryKey }) => void;
};

const PurgedContext = createContext<PurgedContextValue>({
  checkIfRecentlyPurged: () => false,
  markAsPurged: () => undefined,
});

type PurgedProviderProps = {
  children: ReactNode;
};

const stringifyQueryKey = (queryKey: QueryKey) => queryKey.join('|');

const defaultThreshold = 3 * 1000;

const PurgedProvider: FC<PurgedProviderProps> = memo(({ children }) => {
  const lastPurgedAtMap = useRef<Record<string, number | undefined>>({});

  const markAsPurged = useCallback(({ queryKey }: { queryKey: QueryKey }) => {
    lastPurgedAtMap.current[stringifyQueryKey(queryKey)] = Date.now();
  }, []);

  const checkIfRecentlyPurged = useCallback(
    ({
      queryKey,
      threshold = defaultThreshold,
    }: {
      queryKey: QueryKey;
      threshold?: number;
    }) => {
      const lastPurgedAt = lastPurgedAtMap.current[stringifyQueryKey(queryKey)];

      if (!lastPurgedAt) {
        return false;
      }

      const now = Date.now();
      return now - lastPurgedAt <= threshold;
    },
    [],
  );

  return (
    <PurgedContext.Provider value={{ checkIfRecentlyPurged, markAsPurged }}>
      {children}
    </PurgedContext.Provider>
  );
});

PurgedProvider.displayName = 'PurgedProvider';

const usePurged = () => useContext(PurgedContext);

export { PurgedProvider, usePurged };
