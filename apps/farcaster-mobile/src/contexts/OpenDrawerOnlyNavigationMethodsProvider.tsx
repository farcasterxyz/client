import debounce from 'lodash/debounce';
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useUnmediatedOpenDrawer } from '~/hooks/navigation/methods/openDrawer';
import { FullParamList, ScreenName } from '~/types';

export type NavigationMethod = <N extends ScreenName>(
  name: N,
  params: FullParamList[N],
) => ReturnType<typeof debounce> | void;

type NavigationMethodsContextValue = {
  openDrawer: ReturnType<typeof useUnmediatedOpenDrawer>;
};

type NavigationMethodArgs = {
  [K in keyof NavigationMethodsContextValue]: Parameters<
    NavigationMethodsContextValue[K]
  >;
};

function noop() {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('No navigation methods provider found');
  }
}

const NavigationMethodsContext = createContext<NavigationMethodsContextValue>({
  openDrawer: noop,
});

type OpenDrawerOnlyNavigationMethodsProviderProps = {
  children: React.ReactNode;
};

export const OpenDrawerOnlyNavigationMethodsProvider: React.FC<OpenDrawerOnlyNavigationMethodsProviderProps> =
  memo(({ children }) => {
    const unmediatedOpenDrawer = useUnmediatedOpenDrawer();

    const methods = useMemo(
      () => ({
        openDrawer: unmediatedOpenDrawer,
      }),
      [unmediatedOpenDrawer],
    );

    // we need to route all navigation methods through a single debounced function
    // in order to prevent multiple navigation events from being sent in quick succession
    const sharedCaller = useCallback(
      <M extends keyof NavigationMethodsContextValue>(
        method: M,
        ...args: NavigationMethodArgs[M]
      ) => {
        const navigationFn = methods[method] as (
          ...args: NavigationMethodArgs[M]
        ) => ReturnType<NavigationMethodsContextValue[M]> | void;

        navigationFn(...args);
      },
      [methods],
    );

    const debounceAll = useMemo(() => {
      return debounce(sharedCaller, 500, { leading: true, trailing: false });
    }, [sharedCaller]);

    const navigationMethods: NavigationMethodsContextValue = useMemo(() => {
      return {
        openDrawer: () => {
          debounceAll('openDrawer');
        },
      };
    }, [debounceAll]);

    return (
      <NavigationMethodsContext.Provider value={navigationMethods}>
        {children}
      </NavigationMethodsContext.Provider>
    );
  });

export const useOpenDrawerOnlyNavigationMethods = () =>
  useContext(NavigationMethodsContext);
