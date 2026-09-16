import { StackActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';

export function useUnmediatedPop() {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(
    (count = 1) => {
      trackNavigationEvent({ type: 'pop' });

      return dispatch(StackActions.pop(count));
    },
    [dispatch, trackNavigationEvent],
  );
}
