import {
  CommonActions,
  StackActions,
  useNavigation,
} from '@react-navigation/native';
import { useCallback } from 'react';

import { useBottomTab } from '~/contexts/BottomTabProvider';
import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { FullParamList, ScreenName } from '~/types';
import { getActiveStackRoute } from '~/utils/NavigationUtils';

// This is a hook that should work from anywhere, including the Cast screen
// in the root navigator that pushes a route to the currently active tab stack
// Reason we can't use useNavigateToNestedScreen is because if the user is already on the
// screen, the screen is replaced instead of pushed
// Reason we can't simply push to root is that it duplicates root components.
// We have to specifically find the right stack to push to if it exists, or navigate using
// the global navigator if it doesn't.
export function useUnmediatedPushOrNavigateInActiveTab() {
  const navigation = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();
  const { focusedBottomTabRef } = useBottomTab();

  return useCallback(
    <Screen extends ScreenName>(
      screen: ScreenName,
      params: FullParamList[Screen],
    ) => {
      const state = navigation.getState();
      if (state === undefined) {
        return;
      }

      const activeStack = getActiveStackRoute(state);

      if (activeStack && activeStack.state?.key) {
        trackNavigationEvent({
          type: 'pushToNestedStack',
          screen,
          params,
          stack: activeStack.name,
        });
        return navigation.dispatch({
          ...StackActions.push(screen, params),
          target: activeStack.state.key,
        });
      } else {
        trackNavigationEvent({
          type: 'navigateToNestedScreen',
          screen,
          tab: focusedBottomTabRef.current,
          params,
        });
        return navigation.dispatch(
          CommonActions.navigate(focusedBottomTabRef.current, {
            params,
            screen,
          }),
        );
      }
    },
    [focusedBottomTabRef, navigation, trackNavigationEvent],
  );
}
