import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import debounce from 'lodash/debounce';
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useUnmediatedGoBack } from '~/hooks/navigation/methods/goBack';
import { useUnmediatedNavigate } from '~/hooks/navigation/methods/navigate';
import { useUnmediatedNavigateToFeed } from '~/hooks/navigation/methods/navigateToFeed';
import { useUnmediatedNavigateToNestedScreen } from '~/hooks/navigation/methods/navigateToNestedScreen';
import { useUnmediatedPop } from '~/hooks/navigation/methods/pop';
import { useUnmediatedPopToTop } from '~/hooks/navigation/methods/popToTop';
import { useUnmediatedPush } from '~/hooks/navigation/methods/push';
import { useUnmediatedPushOrNavigateInActiveTab } from '~/hooks/navigation/methods/pushOrNavigateInActiveTab';
import { useUnmediatedReplace } from '~/hooks/navigation/methods/replace';
import { FullParamList, ScreenName } from '~/types';

export type NavigationMethod = <N extends ScreenName>(
  name: N,
  params: FullParamList[N],
) => ReturnType<typeof debounce> | void;

type NavigationMethodsContextValue = {
  push: NavigationMethod;
  navigate: NavigationMethod;
  replace: NavigationMethod;
  pushOrNavigateInActiveTab: NavigationMethod;
  pop: ReturnType<typeof useUnmediatedPop>;
  popToTop: ReturnType<typeof useUnmediatedPopToTop>;
  goBack: ReturnType<typeof useUnmediatedGoBack>;
  navigateToFeed: ReturnType<typeof useUnmediatedNavigateToFeed>;
  navigateToNestedScreen: ReturnType<
    typeof useUnmediatedNavigateToNestedScreen
  >;
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
  push: noop,
  navigate: noop,
  replace: noop,
  pushOrNavigateInActiveTab: noop,
  pop: noop,
  popToTop: noop,
  goBack: noop,
  navigateToFeed: noop,
  navigateToNestedScreen: noop,
});

type NavigationMethodsProviderProps = {
  navigationRef: NavigationContainerRefWithCurrent<FullParamList>;
  children: React.ReactNode;
};

export const NavigationMethodsProvider: React.FC<NavigationMethodsProviderProps> =
  memo(({ navigationRef, children }) => {
    const unmediatedPush = useUnmediatedPush();
    const unmediatedNavigate = useUnmediatedNavigate();
    const unmediatedReplace = useUnmediatedReplace();
    const unmediatedPushOrNavigateInActiveTab =
      useUnmediatedPushOrNavigateInActiveTab();
    const unmediatedPop = useUnmediatedPop();
    const unmediatedPopToTop = useUnmediatedPopToTop();
    const unmediatedGoBack = useUnmediatedGoBack();
    const unmediatedNavigateToFeed = useUnmediatedNavigateToFeed();
    const unmediatedNavigateToNestedScreen =
      useUnmediatedNavigateToNestedScreen();

    const methods = useMemo(
      () => ({
        push: unmediatedPush,
        navigate: unmediatedNavigate,
        replace: unmediatedReplace,
        pushOrNavigateInActiveTab: unmediatedPushOrNavigateInActiveTab,
        pop: unmediatedPop,
        popToTop: unmediatedPopToTop,
        goBack: unmediatedGoBack,
        navigateToFeed: unmediatedNavigateToFeed,
        navigateToNestedScreen: unmediatedNavigateToNestedScreen,
      }),
      [
        unmediatedPush,
        unmediatedNavigate,
        unmediatedReplace,
        unmediatedPushOrNavigateInActiveTab,
        unmediatedPop,
        unmediatedPopToTop,
        unmediatedGoBack,
        unmediatedNavigateToFeed,
        unmediatedNavigateToNestedScreen,
      ],
    );

    // we need to route all navigation methods through a single debounced function
    // in order to prevent multiple navigation events from being sent in quick succession
    const sharedCaller = useCallback(
      <M extends keyof NavigationMethodsContextValue>(
        method: M,
        ...args: NavigationMethodArgs[M]
      ) => {
        if (navigationRef.current && navigationRef.current.isReady()) {
          const navigationFn = methods[method] as (
            ...args: NavigationMethodArgs[M]
          ) => ReturnType<NavigationMethodsContextValue[M]> | void;

          navigationFn(...args);
        }
      },
      [methods, navigationRef],
    );

    const debounceAll = useMemo(() => {
      return debounce(sharedCaller, 500, { leading: true, trailing: false });
    }, [sharedCaller]);

    const navigationMethods: NavigationMethodsContextValue = useMemo(() => {
      return {
        push: (name, params) => {
          debounceAll('push', name, params);
        },
        navigate: (name, params) => {
          debounceAll('navigate', name, params);
        },
        replace: (name, params) => {
          debounceAll('replace', name, params);
        },
        pushOrNavigateInActiveTab: (name, params) => {
          debounceAll('pushOrNavigateInActiveTab', name, params);
        },
        pop: (count) => {
          debounceAll('pop', count);
        },
        popToTop: () => {
          debounceAll('popToTop');
        },
        goBack: () => {
          debounceAll('goBack');
        },
        navigateToFeed: (feedId) => {
          debounceAll('navigateToFeed', feedId);
        },
        navigateToNestedScreen: (tab, screen, params) => {
          debounceAll('navigateToNestedScreen', tab, screen, params);
        },
      };
    }, [debounceAll]);

    return (
      <NavigationMethodsContext.Provider value={navigationMethods}>
        {children}
      </NavigationMethodsContext.Provider>
    );
  });

export const useNavigationMethods = () => useContext(NavigationMethodsContext);
