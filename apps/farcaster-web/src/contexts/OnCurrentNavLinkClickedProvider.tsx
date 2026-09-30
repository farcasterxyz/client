import {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

type OnCurrentNavLinkClicked = undefined | (() => Promise<unknown>);
type SetOnCurrentNavLinkClicked = (
  getNextOnCurrentNavLinkClicked: () => OnCurrentNavLinkClicked,
) => void;

type OnCurrentNavLinkClickedContextValue = {
  onCurrentNavLinkClicked: OnCurrentNavLinkClicked;
  setOnCurrentNavLinkClicked: SetOnCurrentNavLinkClicked;
};

const OnCurrentNavLinkClickedContext =
  createContext<OnCurrentNavLinkClickedContextValue>({
    onCurrentNavLinkClicked: async () => undefined,
    setOnCurrentNavLinkClicked: () => undefined,
  });

type OnCurrentNavLinkClickedProviderProps = {
  children: ReactNode;
};

const OnCurrentNavLinkClickedProvider: FC<OnCurrentNavLinkClickedProviderProps> =
  memo(({ children }) => {
    const location = useLocation();

    const [onCurrentNavLinkClicked, _setOnCurrentNavLinkClicked] =
      useState<OnCurrentNavLinkClicked>();

    const locationKey = [location.pathname, location.search].join('|');

    // It's important to use `useLayoutEffect` (rather than `useEffect`) here,
    // because we want the reset logic to run as soon as possible, before the current page sets the `onClick` handler.
    // Note that in development, when `StrictMode` is enabled, the feature works as expected,
    // but in production (or when `StrictMode` is removed in development),
    // the refresh will only work the first time you navigate to a page.
    // I haven't verified, but I assume it comes down to whether RQ misses the cache and triggers suspense.
    useLayoutEffect(() => {
      // Reset the on-click behavior any time the user navigates to a new page
      _setOnCurrentNavLinkClicked(undefined);
    }, [locationKey]);

    const setOnCurrentNavLinkClicked: SetOnCurrentNavLinkClicked = useCallback(
      (getNextOnCurrentNavLinkClicked: () => OnCurrentNavLinkClicked) => {
        _setOnCurrentNavLinkClicked(getNextOnCurrentNavLinkClicked);
      },
      [],
    );

    const value = useMemo(
      () => ({ onCurrentNavLinkClicked, setOnCurrentNavLinkClicked }),
      [onCurrentNavLinkClicked, setOnCurrentNavLinkClicked],
    );

    return (
      <OnCurrentNavLinkClickedContext.Provider value={value}>
        {children}
      </OnCurrentNavLinkClickedContext.Provider>
    );
  });

OnCurrentNavLinkClickedProvider.displayName = 'OnCurrentNavLinkClickedProvider';

const useOnCurrentNavLinkClicked = () =>
  useContext(OnCurrentNavLinkClickedContext);

export { OnCurrentNavLinkClickedProvider, useOnCurrentNavLinkClicked };
