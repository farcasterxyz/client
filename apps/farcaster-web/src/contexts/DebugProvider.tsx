import { createContext, FC, ReactNode, useContext, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from 'react-router-dom';

type DebugContextValue = {
  isEnabled: boolean;
};

const DebugContext = createContext<DebugContextValue>({
  isEnabled: false,
});

type DebugProviderProps = {
  children: ReactNode;
};

const DebugProvider: FC<DebugProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();

  const isEnabled = useMemo(() => {
    const debugValue = searchParams.get('debug') || '';
    return ['1', 'true'].includes(debugValue);
  }, [searchParams]);

  return (
    <DebugContext.Provider value={{ isEnabled }}>
      {children}
    </DebugContext.Provider>
  );
};

const useDebug = () => useContext(DebugContext);

export { DebugProvider, useDebug };
