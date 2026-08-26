import * as SplashScreen from 'expo-splash-screen';
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

type SplashContextValue = {
  isAppInitialized: boolean;
  onAppInitialized: () => void;
};

const SplashContext = createContext<SplashContextValue>({
  isAppInitialized: false,
  onAppInitialized: () => undefined,
});

const dismissSplashDelay = 50;

type SplashProviderProps = {
  children: ReactNode;
};

const SplashProvider: FC<SplashProviderProps> = memo(({ children }) => {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const hasHiddenSplashScreenRef = useRef(false);

  const onAppInitialized = useCallback(() => {
    setIsAppInitialized(true);
    if (!hasHiddenSplashScreenRef.current) {
      hasHiddenSplashScreenRef.current = true;
      setTimeout(() => SplashScreen.hideAsync(), dismissSplashDelay);
    }
  }, []);

  return (
    <SplashContext.Provider value={{ isAppInitialized, onAppInitialized }}>
      {children}
    </SplashContext.Provider>
  );
});

const useSplash = () => useContext(SplashContext);

SplashProvider.displayName = 'SplashProvider';

export { dismissSplashDelay, SplashProvider, useSplash };
