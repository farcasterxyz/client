import pull from 'lodash/pull';
import {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

type KeyPressCallback = (e: KeyboardEvent) => void;
type UnsubscribeFromKeyPress = () => void;

type GlobalKeyPressContextValue = {
  addKeyPressListener: (callback: KeyPressCallback) => UnsubscribeFromKeyPress;
};

const GlobalKeyPressContext = createContext<GlobalKeyPressContextValue>({
  addKeyPressListener: () => () => undefined,
});

type GlobalKeyPressProviderProps = {
  children: ReactNode;
};

const GlobalKeyPressProvider: FC<GlobalKeyPressProviderProps> = memo(
  ({ children }) => {
    const listeners = useRef<KeyPressCallback[]>([]).current;

    const addKeyPressListener = useCallback(
      (callback: KeyPressCallback) => {
        listeners.push(callback);
        return () => {
          pull(listeners, callback);
        };
      },
      [listeners],
    );

    useEffect(() => {
      const onKeyPress = (e: KeyboardEvent) => {
        listeners.forEach((callback) => {
          callback(e);
        });
      };

      // Browsers don't seem to fire keypress for escape key
      window.addEventListener('keyup', onKeyPress);
      return () => window.removeEventListener('keyup', onKeyPress);
    }, [listeners]);

    return (
      <GlobalKeyPressContext.Provider value={{ addKeyPressListener }}>
        {children}
      </GlobalKeyPressContext.Provider>
    );
  },
);

const useGlobalKeyPress = () => useContext(GlobalKeyPressContext);

GlobalKeyPressProvider.displayName = 'GlobalKeyPressProvider';

export { GlobalKeyPressProvider, useGlobalKeyPress };
