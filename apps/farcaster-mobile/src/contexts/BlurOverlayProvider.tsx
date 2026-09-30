import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

type BlurOverlayContext = {
  setBlurOverlayChildren: (children?: ReactNode) => void;
  blurOverlayChildren?: ReactNode;
};

const BlurOverlayContext = createContext<BlurOverlayContext>({
  setBlurOverlayChildren: (_children?: ReactNode) => {},
  blurOverlayChildren: undefined,
});

type BlurOverlayProviderProps = {
  children?: ReactNode;
};

const BlurOverlayProvider: FC<BlurOverlayProviderProps> = memo(
  ({ children }) => {
    const [blurOverlayChildren, setBlurOverlayChildren] = useState<ReactNode>();

    // On Android, dismiss the blur overlay when the app returns from
    // background. If the overlay was visible when the device slept (e.g. a
    // long-press reaction menu), it would otherwise persist as an invisible
    // full-screen touchable view that blocks all interactions.
    const previousAppState = useRef<AppStateStatus>(AppState.currentState);
    useEffect(() => {
      if (Platform.OS !== 'android') {
        return;
      }
      const subscription = AppState.addEventListener(
        'change',
        (nextState: AppStateStatus) => {
          if (
            previousAppState.current.match(/inactive|background/) &&
            nextState === 'active'
          ) {
            setBlurOverlayChildren(undefined);
          }
          previousAppState.current = nextState;
        },
      );
      return () => subscription.remove();
    }, []);

    const value = useMemo(
      () => ({
        blurOverlayChildren,
        setBlurOverlayChildren,
      }),
      [blurOverlayChildren, setBlurOverlayChildren],
    );
    return (
      <BlurOverlayContext.Provider value={value}>
        {children}
      </BlurOverlayContext.Provider>
    );
  },
);

BlurOverlayProvider.displayName = 'BlurOverlayProvider';

const useBlurOverlay = () => useContext(BlurOverlayContext);

export { BlurOverlayProvider, useBlurOverlay };
