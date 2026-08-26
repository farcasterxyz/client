/// <reference types="navigation-api-types" />
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface IContext {
  popped: boolean;
}
const popStateContext = createContext<IContext>({
  popped: false,
});

export function useCameFromPopped() {
  const context = useContext(popStateContext);
  return context.popped;
}

export function PopStateProvider({ children }: PropsWithChildren<{}>) {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    function handleNavigate(event: NavigateEvent) {
      if (event.navigationType !== 'traverse') {
        setPopped(false);
      }
    }

    function handlePopState() {
      setPopped(true);
    }

    window.addEventListener('popstate', handlePopState);
    window.navigation?.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.navigation?.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  const memoizedValues = useMemo(
    () => ({
      popped,
    }),
    [popped],
  );

  return (
    <popStateContext.Provider value={memoizedValues}>
      {children}
    </popStateContext.Provider>
  );
}
