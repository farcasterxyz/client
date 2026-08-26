import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { BottomTabName, FullParamList, ScreenName } from '~/types';

// This hook is useful when we need to navigate to nested stacks (e.g. pushing a screen onto a bottom tab stack from the side drawer)
// https://reactnavigation.org/docs/nesting-navigators/#navigating-to-a-screen-in-a-nested-navigator
export function useUnmediatedNavigateToNestedScreen() {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(
    <Tab extends BottomTabName, Screen extends ScreenName>(
      tab: Tab,
      screen: ScreenName,
      params: FullParamList[Screen],
    ) => {
      trackNavigationEvent({
        type: 'navigateToNestedScreen',
        screen,
        tab,
        params,
      });
      return dispatch(CommonActions.navigate(tab, { params, screen }));
    },
    [dispatch, trackNavigationEvent],
  );
}
