import React, {
  createContext,
  FC,
  memo,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

type HasUnmountedStoreContextValue = {
  getRef: (id: string) => MutableRefObject<boolean> | undefined;
  setRef: (id: string, ref: MutableRefObject<boolean>) => void;
};

const HasUnmountedStoreContext = createContext<HasUnmountedStoreContextValue>({
  getRef: () => undefined,
  setRef: () => undefined,
});

type HasUnmountedProviderProps = {
  children: ReactNode;
};

const HasUnmountedProvider: FC<HasUnmountedProviderProps> = memo(
  ({ children }) => {
    const refs = useRef<Record<string, MutableRefObject<boolean> | undefined>>(
      {},
    );

    const getRef = useCallback((id: string) => {
      return refs.current[id];
    }, []);

    const setRef = useCallback((id: string, ref: MutableRefObject<boolean>) => {
      refs.current[id] = ref;
    }, []);

    const value = useMemo(() => ({ getRef, setRef }), [getRef, setRef]);

    return (
      <HasUnmountedStoreContext.Provider value={value}>
        {children}
      </HasUnmountedStoreContext.Provider>
    );
  },
);

const useHasUnmountedRef = ({ id }: { id: string }) => {
  const { getRef, setRef } = useContext(HasUnmountedStoreContext);
  const fallbackRef = useRef(false);
  const ref = getRef(id) || fallbackRef;

  setRef(id, ref);
  ref.current = false;

  useEffect(() => {
    return () => {
      ref.current = true;
    };
  }, [id, ref]);

  return ref;
};

export { HasUnmountedProvider, useHasUnmountedRef };
