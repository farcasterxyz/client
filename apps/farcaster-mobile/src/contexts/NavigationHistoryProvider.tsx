import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { ValueOf } from 'farcaster-client-data/src/utils/TypeUtils';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

import { BottomTabName, FullParamList, ScreenName } from '~/types';

const maxNumEntries = 100;

export type NavigationHistoryEvent =
  | {
      type: 'push';
      name: ScreenName;
      params: ValueOf<FullParamList>;
      isFromDeepLink?: boolean;
      isFromPushNotification?: boolean;
    }
  | {
      type: 'navigate';
      name: ScreenName;
      params: ValueOf<FullParamList>;
      isFromDeepLink?: boolean;
      isFromPushNotification?: boolean;
    }
  | {
      type: 'navigateToNestedScreen';
      screen: ScreenName;
      params: ValueOf<FullParamList>;
      tab: BottomTabName;
    }
  | {
      type: 'pushToNestedStack';
      screen: ScreenName;
      params: ValueOf<FullParamList>;
      stack: string;
    }
  | { type: 'pop' }
  | { type: 'popToTop' }
  | { type: 'goBack' }
  | { type: 'openDrawer' }
  | {
      type: 'screenFocused';
      name: ScreenName;
    }
  | {
      type: 'replace';
      name: ScreenName;
      params: ValueOf<FullParamList>;
    };

export type NavigationHistoryEventWithTimestamp = NavigationHistoryEvent & {
  timestamp: number;
  id: number;
};

type NavigationHistoryContextValue = {
  navigationHistory: NavigationHistoryEventWithTimestamp[];
  trackNavigationEvent: (event: NavigationHistoryEvent) => void;
};

const NavigationHistoryContext = createContext<NavigationHistoryContextValue>({
  navigationHistory: [],
  trackNavigationEvent: () => undefined,
});

type NavigationHistoryProviderProps = {
  children: ReactNode;
};

const NavigationHistoryProvider: FC<NavigationHistoryProviderProps> = memo(
  ({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'NavigationHistoryProvider',
    });

    const navigationHistory = useRef<NavigationHistoryEventWithTimestamp[]>(
      [],
    ).current;
    const nextEventId = useRef(0);

    const trackNavigationEvent = useCallback(
      (event: NavigationHistoryEvent) => {
        navigationHistory.unshift({
          ...event,
          timestamp: Date.now(),
          id: nextEventId.current++,
        });

        if (navigationHistory.length > maxNumEntries) {
          navigationHistory.length = maxNumEntries;
        }
      },
      [navigationHistory],
    );

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'NavigationHistoryProvider',
    });

    return (
      <NavigationHistoryContext.Provider
        value={{ navigationHistory, trackNavigationEvent }}
      >
        {children}
      </NavigationHistoryContext.Provider>
    );
  },
);

NavigationHistoryProvider.displayName = 'NavigationHistoryProvider';

const useNavigationHistory = () => useContext(NavigationHistoryContext);

export { NavigationHistoryProvider, useNavigationHistory };
