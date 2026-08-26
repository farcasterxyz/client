import { QueryKey } from '@tanstack/react-query';
import React, {
  createContext,
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

type UsageCounts = Record<string, number | undefined>;

interface GlobalCacheUsageContextValue {
  addUsage: (key: string) => void;
  getUsageCount: (key: string) => number;
  removeUsage: (key: string) => void;
}

const GlobalCacheUsageContext = createContext<GlobalCacheUsageContextValue>({
  addUsage: () => undefined,
  getUsageCount: () => 0,
  removeUsage: () => undefined,
});

const stringifyGlobalCacheUsageKey = (key: QueryKey) => key.join('|');

type GlobalCacheUsageProviderProps = PropsWithChildren;

const GlobalCacheUsageProvider = memo(
  ({ children }: GlobalCacheUsageProviderProps) => {
    const usageCounts = useRef<UsageCounts>({});

    const addUsage = useCallback(
      (key: string) => {
        const prevValue = usageCounts.current[key];
        const nextValue = (prevValue || 0) + 1;
        usageCounts.current[key] = nextValue;
      },
      [usageCounts],
    );

    const removeUsage = useCallback(
      (key: string) => {
        const prevValue = usageCounts.current[key];
        const nextValue = Math.max(0, (prevValue || 1) - 1);
        usageCounts.current[key] = nextValue;
      },
      [usageCounts],
    );

    const getUsageCount = useCallback(
      (key: string) => {
        return usageCounts.current[key] || 0;
      },
      [usageCounts],
    );

    const contextValue = useMemo(
      () => ({ addUsage, removeUsage, getUsageCount }),
      [addUsage, getUsageCount, removeUsage],
    );

    return (
      <GlobalCacheUsageContext.Provider value={contextValue}>
        {children}
      </GlobalCacheUsageContext.Provider>
    );
  },
);

const useGlobalCacheUsage = () => useContext(GlobalCacheUsageContext);

export {
  GlobalCacheUsageProvider,
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
};
